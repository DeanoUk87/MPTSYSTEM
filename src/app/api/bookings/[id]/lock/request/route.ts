import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { setRequester } from "@/lib/lock-store";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ok = setRequester(id, session.id, session.name || session.id);
  return ok
    ? NextResponse.json({ requested: true })
    : NextResponse.json({ error: "No active lock found" }, { status: 404 });
}
