import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { cliqConfigured, cliqBaseUrl, getCliqToken } from "@/lib/cliq-token";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!cliqConfigured()) {
    return NextResponse.json({ configured: false, chats: [] });
  }

  const token = await getCliqToken();
  if (!token) {
    return NextResponse.json({ configured: true, error: "Token error", chats: [] }, { status: 502 });
  }

  const headers = { Authorization: `Zoho-oauthtoken ${token}` };
  const makeOpts = () => {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 8000);
    return { headers, cache: "no-store" as const, signal: ctrl.signal };
  };

  const [chatsRes, channelsRes] = await Promise.allSettled([
    fetch(`${cliqBaseUrl()}/chats`, makeOpts()),
    fetch(`${cliqBaseUrl()}/channels`, makeOpts()),
  ]);

  const chats: any[] = [];

  if (chatsRes.status === "fulfilled" && chatsRes.value.ok) {
    const d = await chatsRes.value.json();
    for (const c of d.chats ?? []) {
      chats.push({ ...c, is_channel: false });
    }
  }

  if (channelsRes.status === "fulfilled" && channelsRes.value.ok) {
    const d = await channelsRes.value.json();
    for (const c of d.channels ?? []) {
      chats.push({
        chat_id: c.channel_id ?? c.id,
        name: c.name,
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
