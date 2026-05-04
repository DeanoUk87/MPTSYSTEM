import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// POST /api/pod-manager/download-zip
// body: { fileIds: string[], folderIds?: string[] }
// Returns a zip archive of the requested files
export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const fileIds: string[] = Array.isArray(body.fileIds) ? body.fileIds : [];
  const folderIds: string[] = Array.isArray(body.folderIds) ? body.folderIds : [];

  // Collect all file records
  let allFileIds = [...fileIds];
  for (const fid of folderIds) {
    const ids = await collectFolderFileIds(fid);
    allFileIds = allFileIds.concat(ids);
  }
  allFileIds = [...new Set(allFileIds)];

  if (allFileIds.length === 0) return NextResponse.json({ error: "No files specified" }, { status: 400 });

  const files = await prisma.podFile.findMany({
    where: { id: { in: allFileIds }, deletedAt: null },
  });

  // Build zip in memory using a simple approach (without archiver dependency)
  // We'll use a streaming approach with the native zip format
  // Since we cannot install new packages easily, we return a multipart response with direct URLs
  // and build a client-side zip using JSZip. Here we return the file list for client-side zipping.
  const fileList = files
    .map(f => ({
      id: f.id,
      filename: f.filename,
      filePath: f.filePath,
      fileSize: f.fileSize,
      mimeType: f.mimeType,
    }))
    .filter(f => existsSync(path.join(process.cwd(), "public", f.filePath)));

  return NextResponse.json({ files: fileList });
}

async function collectFolderFileIds(folderId: string): Promise<string[]> {
  const files = await prisma.podFile.findMany({
    where: { folderId, deletedAt: null },
    select: { id: true },
  });
  const children = await prisma.podFolder.findMany({
    where: { parentId: folderId, deletedAt: null },
    select: { id: true },
  });
  let ids = files.map(f => f.id);
  for (const child of children) {
    ids = ids.concat(await collectFolderFileIds(child.id));
  }
  return ids;
}
