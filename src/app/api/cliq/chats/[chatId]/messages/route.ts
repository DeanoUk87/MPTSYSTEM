import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { cliqBaseUrl, getCliqToken } from "@/lib/cliq-token";

export async function GET(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await params;
  const token = await getCliqToken();
  if (!token) return NextResponse.json({ error: "Token error" }, { status: 502 });

  const res = await fetch(`${cliqBaseUrl()}/chats/${encodeURIComponent(chatId)}/messages?limit=40`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Upstream error" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ messages: data.data ?? [] });
}
