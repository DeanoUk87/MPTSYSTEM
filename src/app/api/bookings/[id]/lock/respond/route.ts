import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { respondToRequest } from "@/lib/lock-store";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { decision } = await req.json();
  if (decision !== "allowed" && decision !== "denied") {
    return NextResponse.json({ error: "decision must be 'allowed' or 'denied'" }, { status: 400 });
  }
  const ok = respondToRequest(id, session.id, decision);
  return ok
    ? NextResponse.json({ responded: true })
    : NextResponse.json({ error: "You do not own the lock for this booking" }, { status: 403 });
}
