import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "pod");

async function ensureDir() {
  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
}

function parsePodFiles(raw: string | null | undefined): string[] {
  if (!raw) return [];
  if (raw.startsWith("[")) { try { return JSON.parse(raw); } catch { return []; } }
  return [raw]; // legacy single-path string
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });

    await ensureDir();

    const existing = await prisma.booking.findUnique({ where: { id }, select: { podUpload: true } });
    const files = parsePodFiles(existing?.podUpload);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const filename = `${id}-${Date.now()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    files.push(`/api/uploads/pod/${filename}`);
    await prisma.booking.update({ where: { id }, data: { podUpload: JSON.stringify(files) } });

    return NextResponse.json({ podUpload: files });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const fileToRemove = req.nextUrl.searchParams.get("file");
    const existing = await prisma.booking.findUnique({ where: { id }, select: { podUpload: true } });
    const files = parsePodFiles(existing?.podUpload);

    function filePathToDisk(fp: string): string {
      // Handles both /uploads/pod/X and /api/uploads/pod/X
      const rel = fp.replace(/^\/api/, "");
      return path.join(process.cwd(), "public", rel);
    }

    if (fileToRemove) {
      await unlink(filePathToDisk(fileToRemove)).catch(() => {});
      const updated = files.filter(f => f !== fileToRemove);
      await prisma.booking.update({ where: { id }, data: { podUpload: updated.length ? JSON.stringify(updated) : null } });
      return NextResponse.json({ podUpload: updated });
    } else {
      for (const f of files) {
        await unlink(filePathToDisk(f)).catch(() => {});
      }
      await prisma.booking.update({ where: { id }, data: { podUpload: null } });
      return NextResponse.json({ podUpload: [] });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
