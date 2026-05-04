import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// POST /api/pod-manager/bulk
// body: { action: "delete" | "move", fileIds: string[], folderId?: string }
export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, fileIds, folderId } = body as {
    action: "delete" | "move";
    fileIds: string[];
    folderId?: string;
  };

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return NextResponse.json({ error: "No files specified" }, { status: 400 });
  }

  if (action === "delete") {
    const canDelete = session.roles?.includes("admin") || session.permissions?.includes("pod_manager_delete");
    if (!canDelete) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    try {
      // Soft delete
      await prisma.podFile.updateMany({
        where: { id: { in: fileIds } },
        data: { deletedAt: new Date() },
      });
      return NextResponse.json({ ok: true, affected: fileIds.length });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (action === "move") {
    const canMove = session.roles?.includes("admin") || session.permissions?.includes("pod_manager_move");
    if (!canMove) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    try {
      await prisma.podFile.updateMany({
        where: { id: { in: fileIds } },
        data: { folderId: folderId || null },
      });
      return NextResponse.json({ ok: true, affected: fileIds.length });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
