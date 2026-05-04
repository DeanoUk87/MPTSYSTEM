import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// PATCH /api/pod-manager/folders/[id] — rename or move
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canManage = session.roles?.includes("admin") || session.permissions?.includes("pod_manager_manage");
  if (!canManage) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, parentId } = body;

  try {
    const updated = await prisma.podFolder.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(parentId !== undefined ? { parentId: parentId || null } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/pod-manager/folders/[id] — soft delete
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canDelete = session.roles?.includes("admin") || session.permissions?.includes("pod_manager_delete");
  if (!canDelete) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

  const { id } = await params;
  const now = new Date();

  try {
    // Soft-delete folder and all files inside recursively
    await softDeleteFolderTree(id, now);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function softDeleteFolderTree(folderId: string, now: Date) {
  // Delete all files in this folder
  await prisma.podFile.updateMany({ where: { folderId, deletedAt: null }, data: { deletedAt: now } });
  // Recurse into children
  const children = await prisma.podFolder.findMany({ where: { parentId: folderId, deletedAt: null }, select: { id: true } });
  for (const child of children) await softDeleteFolderTree(child.id, now);
  // Delete the folder itself
  await prisma.podFolder.update({ where: { id: folderId }, data: { deletedAt: now } });
}
