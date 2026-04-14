import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { cliqBaseUrl, getCliqToken } from "@/lib/cliq-token";

export async function POST(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await params;
  const body = await req.json();
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "Message text required" }, { status: 400 });

  const token = await getCliqToken();
  if (!token) return NextResponse.json({ error: "Token error" }, { status: 502 });

  const res = await fetch(`${cliqBaseUrl()}/chats/${encodeURIComponent(chatId)}/message`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Upstream error" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ ok: true, message: data });
}
