import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "pod");

// PATCH /api/pod-manager/files/[id] — rename or move
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { filename, folderId, action } = body; // action: "move" | "copy" | "rename"

  if (action === "copy") {
    const canMove = session.roles?.includes("admin") || session.permissions?.includes("pod_manager_move");
    if (!canMove) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    try {
      const original = await prisma.podFile.findUnique({ where: { id } });
      if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

      // Copy the physical file
      const { readFile, writeFile } = await import("fs/promises");
      const { mkdir } = await import("fs/promises");
      const { existsSync } = await import("fs");
      const srcPath = path.join(process.cwd(), "public", original.filePath);
      const ext = original.storedName.split(".").pop()?.toLowerCase() ?? "jpg";
      const newStoredName = `pod-mgr-copy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const destPath = path.join(UPLOAD_DIR, newStoredName);
      if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
      await writeFile(destPath, await readFile(srcPath));

      const copy = await prisma.podFile.create({
        data: {
          folderId: folderId ?? original.folderId,
          filename: `${original.filename} (copy)`,
          storedName: newStoredName,
          filePath: `/uploads/pod/${newStoredName}`,
          mimeType: original.mimeType,
          fileSize: original.fileSize,
          customerId: original.customerId,
          bookingId: original.bookingId,
          uploadedById: session.id,
        },
      });
      return NextResponse.json(copy);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // Rename or move
  if (filename !== undefined) {
    const canRename = session.roles?.includes("admin") || session.permissions?.includes("pod_manager_rename");
    if (!canRename) return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }
  if (folderId !== undefined) {
    const canMove = session.roles?.includes("admin") || session.permissions?.includes("pod_manager_move");
    if (!canMove) return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  try {
    const updated = await prisma.podFile.update({
      where: { id },
      data: {
        ...(filename !== undefined ? { filename: filename.trim() } : {}),
        ...(folderId !== undefined ? { folderId: folderId || null } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/pod-manager/files/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canDelete = session.roles?.includes("admin") || session.permissions?.includes("pod_manager_delete");
  if (!canDelete) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const permanent = searchParams.get("permanent") === "true";

  try {
    const file = await prisma.podFile.findUnique({ where: { id } });
    if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (permanent) {
      // Delete physical file
      const physPath = path.join(process.cwd(), "public", file.filePath);
      if (existsSync(physPath)) await unlink(physPath);
      await prisma.podFile.delete({ where: { id } });
    } else {
      await prisma.podFile.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
