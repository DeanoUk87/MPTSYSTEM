import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { cliqBaseUrl, getCliqToken, invalidateCliqToken } from "@/lib/cliq-token";

export async function POST(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await params;
  const body = await req.json();
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const isChannel = body?.isChannel === true;
  if (!text) return NextResponse.json({ error: "Message text required" }, { status: 400 });

  let token = await getCliqToken();
  if (!token) return NextResponse.json({ error: "Token error" }, { status: 502 });

  const endpoint = isChannel
    ? `${cliqBaseUrl()}/channels/${encodeURIComponent(chatId)}/message`
    : `${cliqBaseUrl()}/chats/${encodeURIComponent(chatId)}/message`;

  const doSend = async (t: string) => fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Zoho-oauthtoken ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  let res = await doSend(token);

  if (res.status === 401) {
    invalidateCliqToken();
    const fresh = await getCliqToken();
    if (!fresh) return NextResponse.json({ error: "Token refresh failed" }, { status: 502 });
    res = await doSend(fresh);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return NextResponse.json({ error: `Send failed (${res.status})`, detail }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ ok: true, message: data });
}
