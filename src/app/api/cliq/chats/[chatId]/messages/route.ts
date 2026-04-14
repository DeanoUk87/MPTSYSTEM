import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { cliqBaseUrl, getCliqToken } from "@/lib/cliq-token";

export async function GET(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await params;
  const isChannel = req.nextUrl.searchParams.get("isChannel") === "1";
  const token = await getCliqToken();
  if (!token) return NextResponse.json({ error: "Token error" }, { status: 502 });

  const endpoint = isChannel
    ? `${cliqBaseUrl()}/channels/${encodeURIComponent(chatId)}/messages?limit=40`
    : `${cliqBaseUrl()}/chats/${encodeURIComponent(chatId)}/messages?limit=40`;

  const res = await fetch(endpoint, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Upstream error" }, { status: res.status });
  }

  const data = await res.json();
  // Zoho returns { data: [{id, sender: {name}, text, time, message_type}] }
  const raw: any[] = data.data ?? data.messages ?? [];
  const messages = raw
    .filter((m: any) => m.message_type === "text" || m.text)
    .map((m: any) => ({
      id: m.id ?? m.message_id ?? String(Math.random()),
      sender_name: m.sender?.name ?? m.sender_name ?? "Unknown",
      text: m.text ?? "",
      time: m.time ?? "",
    }));

  return NextResponse.json({ messages });
}
