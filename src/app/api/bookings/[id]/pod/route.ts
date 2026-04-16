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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Validate type and size (10 MB max)
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });

    await ensureDir();

    // Delete old file if exists
    const existing = await prisma.booking.findUnique({ where: { id }, select: { podUpload: true } });
    if (existing?.podUpload) {
      const oldPath = path.join(process.cwd(), "public", existing.podUpload);
      await unlink(oldPath).catch(() => {});
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const filename = `${id}-${Date.now()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const podUpload = `/uploads/pod/${filename}`;
    await prisma.booking.update({ where: { id }, data: { podUpload } });

    return NextResponse.json({ podUpload });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const existing = await prisma.booking.findUnique({ where: { id }, select: { podUpload: true } });
    if (existing?.podUpload) {
      const filePath = path.join(process.cwd(), "public", existing.podUpload);
      await unlink(filePath).catch(() => {});
    }
    await prisma.booking.update({ where: { id }, data: { podUpload: null } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
