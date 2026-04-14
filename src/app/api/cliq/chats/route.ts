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

  const res = await fetch(`${cliqBaseUrl()}/chats`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    return NextResponse.json({ configured: true, error: "Upstream error", chats: [] }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ configured: true, chats: data.chats ?? [] });
}
