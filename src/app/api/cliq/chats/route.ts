import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { cliqConfigured, cliqBaseUrl, getCliqToken, invalidateCliqToken } from "@/lib/cliq-token";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!cliqConfigured()) {
    return NextResponse.json({ configured: false, chats: [] });
  }

  let token = await getCliqToken();
  if (!token) {
    return NextResponse.json({ configured: true, error: "Token error", chats: [] }, { status: 502 });
  }

  let headers: Record<string, string> = { Authorization: `Zoho-oauthtoken ${token}` };

  const makeOpts = () => {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 8000);
    return { headers, cache: "no-store" as const, signal: ctrl.signal };
  };

  // If token is stale, invalidate and refresh before fetching both endpoints
  const probe = await fetch(`${cliqBaseUrl()}/chats`, makeOpts()).catch(() => null);
  if (probe?.status === 401) {
    invalidateCliqToken();
    const fresh = await getCliqToken();
    if (!fresh) return NextResponse.json({ configured: true, error: "Token refresh failed", chats: [] }, { status: 502 });
    headers = { Authorization: `Zoho-oauthtoken ${fresh}` };
  }

  const [chatsRes, channelsRes] = await Promise.allSettled([
    probe && probe.ok ? Promise.resolve(probe) : fetch(`${cliqBaseUrl()}/chats`, makeOpts()),
    fetch(`${cliqBaseUrl()}/channels`, makeOpts()),
  ]);

  const chats: any[] = [];

  if (chatsRes.status === "fulfilled" && chatsRes.value.ok) {
    const d = await chatsRes.value.json();
    for (const c of d.chats ?? []) {
      if (c.removed) continue;
      if (c.chat_type === "bot") continue;
      if (!c.last_message_info) continue; // skip chats with no messages
      // skip chats where a participant has been removed from the org
      const hasRemovedUser = (c.recipients_summary ?? []).some((r: any) => r.removed === true);
      if (hasRemovedUser) continue;
      chats.push({ ...c, is_channel: false });
    }
  }

  if (channelsRes.status === "fulfilled" && channelsRes.value.ok) {
    const d = await channelsRes.value.json();
    for (const c of d.channels ?? []) {
      if (!c.joined) continue; // only include channels the user has joined
      chats.push({
        chat_id: c.chat_id ?? c.channel_id ?? c.id,
        name: c.name ?? c.unique_name,
        unread_message_count: c.unread_message_count ?? 0,
        last_message_info: c.last_message_info,
        chat_type: "channel",
        is_channel: true,
      });
    }
  }

  // Sort by last message time descending
  chats.sort((a, b) => {
    const ta = a.last_message_info?.time ?? a.last_modified_time ?? "";
    const tb = b.last_message_info?.time ?? b.last_modified_time ?? "";
    return tb.localeCompare(ta);
  });

  return NextResponse.json({ configured: true, chats });
}
