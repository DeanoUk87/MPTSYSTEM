import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getLock, acquireLock, renewLock, releaseLock, forceLock } from "@/lib/lock-store";

function lockResponse(entry: ReturnType<typeof getLock>, userId: string) {
  if (!entry) return { locked: false };
  const isMe = entry.userId === userId;
  return {
    locked: true,
    lockedBy: { id: entry.userId, name: entry.userName },
    isMe,
    requester: isMe ? (entry.requester ?? null) : null,
    response: !isMe ? (entry.response ?? null) : null,
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  return NextResponse.json(lockResponse(getLock(id), session.id));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  let force = false;
  try { const body = await req.json(); force = !!body.force; } catch { /* no body */ }

  const userName = (session as any).name || session.id;

  if (force) {
    forceLock(id, session.id, userName);
    return NextResponse.json(lockResponse(getLock(id), session.id));
  }

  // Try renew first (already own it)
  const renewed = renewLock(id, session.id);
  if (renewed) return NextResponse.json(lockResponse(renewed, session.id));

  // Try fresh acquire
  const acquired = acquireLock(id, session.id, userName);
  if (acquired) return NextResponse.json(lockResponse(getLock(id), session.id));

  // Locked by someone else
  return NextResponse.json({ ...lockResponse(getLock(id), session.id) }, { status: 423 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  releaseLock(id, session.id);
  return NextResponse.json({ released: true });
}
