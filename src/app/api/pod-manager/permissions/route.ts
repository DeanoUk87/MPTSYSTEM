import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET /api/pod-manager/permissions
export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.roles?.includes("admin");
  if (!isAdmin) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

  const perms = await prisma.podPermission.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(perms);
}

// POST /api/pod-manager/permissions — create/update
export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.roles?.includes("admin");
  if (!isAdmin) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

  const body = await req.json();
  const { userId, roleId, customerId, canUpload, canMove, canRename, canDelete, canShare, canManage } = body;

  const perm = await prisma.podPermission.create({
    data: {
      userId: userId || null,
      roleId: roleId || null,
      customerId: customerId || null,
      canUpload: !!canUpload,
      canMove: !!canMove,
      canRename: !!canRename,
      canDelete: !!canDelete,
      canShare: !!canShare,
      canManage: !!canManage,
    },
  });
  return NextResponse.json(perm);
}

// DELETE /api/pod-manager/permissions?id=
export async function DELETE(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.roles?.includes("admin");
  if (!isAdmin) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.podPermission.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
