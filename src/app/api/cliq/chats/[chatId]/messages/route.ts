import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { cliqBaseUrl, getCliqToken, invalidateCliqToken } from "@/lib/cliq-token";

async function fetchMessages(endpoint: string, token: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(endpoint, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
      cache: "no-store",
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await params;
  const isChannel = req.nextUrl.searchParams.get("isChannel") === "1";

  const endpoint = isChannel
    ? `${cliqBaseUrl()}/chats/${encodeURIComponent(chatId)}/messages?limit=40`
    : `${cliqBaseUrl()}/chats/${encodeURIComponent(chatId)}/messages?limit=40`;

  let token = await getCliqToken();
  if (!token) return NextResponse.json({ error: "Token error", messages: [] }, { status: 502 });

  let res: Response;
  try {
    res = await fetchMessages(endpoint, token);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Fetch failed", messages: [] }, { status: 502 });
  }

  // If token rejected, invalidate and retry once with a fresh token
  if (res.status === 401) {
    invalidateCliqToken();
    const fresh = await getCliqToken();
    if (!fresh) return NextResponse.json({ error: "Token refresh failed", messages: [] }, { status: 502 });
    try {
      res = await fetchMessages(endpoint, fresh);
    } catch (e: any) {
      return NextResponse.json({ error: e?.message ?? "Fetch failed", messages: [] }, { status: 502 });
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return NextResponse.json({ error: `Upstream ${res.status}`, detail: body, messages: [] }, { status: res.status });
  }

  const data = await res.json();
  const raw: any[] = data.data ?? data.messages ?? [];
  const messages = raw
    .filter((m: any) => m.type === "text" || m.message_type === "text")
    .map((m: any) => ({
      id: m.id ?? m.message_id ?? String(Math.random()),
      sender_name: m.sender?.name ?? m.sender_name ?? "Unknown",
      text: m.content?.text ?? m.text ?? "",
      // time is unix ms from Zoho; convert to ISO so formatTime() works
      time: m.time ? new Date(m.time).toISOString() : "",
    }))
    .filter(m => m.text.trim() !== "");

  return NextResponse.json({ messages, _raw_count: raw.length });
}
