import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriverAuth } from "@/lib/api-auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "pod");

async function ensureDir() {
  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; viaId: string }> }
) {
  const session = await requireDriverAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, viaId } = await params;

  try {
    const contact = await prisma.driverContact.findUnique({ where: { id: session.dcontactId } });
    if (!contact) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

    const booking = await prisma.booking.findFirst({
      where: { id, secondManId: contact.driverId, driverContactId: contact.id, deletedAt: null },
      select: { id: true },
    });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const via = await prisma.viaAddress.findFirst({
      where: { id: viaId, bookingId: id, deletedAt: null },
      select: { id: true, notes: true },
    });
    if (!via) return NextResponse.json({ error: "Via stop not found" }, { status: 404 });

    // Read podUpload via raw query since the generated client may not have this field yet
    const rawVia = await prisma.$queryRaw<{ podUpload: string | null }[]>`
      SELECT podUpload FROM via_addresses WHERE id = ${viaId} LIMIT 1
    `;
    const existingPodUpload = rawVia[0]?.podUpload ?? null;

    const formData = await req.formData();
    const signedBy = (formData.get("signedBy") as string)?.trim();
    const time = (formData.get("time") as string)?.trim();
    const relationship = (formData.get("relationship") as string)?.trim() || null;
    const temperature = (formData.get("temperature") as string)?.trim() || null;
    const notes = (formData.get("notes") as string)?.trim() || null;
    const photo = formData.get("photo") as File | null;

    if (!signedBy) return NextResponse.json({ error: "Signed by is required" }, { status: 400 });
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json({ error: "Invalid time format (HH:MM)" }, { status: 400 });
    }

    const today = new Date();
    const podDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    let photoPath: string | undefined;
    if (photo && photo.size > 0) {
      const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
      if (!allowed.includes(photo.type)) return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
      if (photo.size > 15 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 15 MB)" }, { status: 400 });

      await ensureDir();
      const ext = photo.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const filename = `via-${viaId}-${Date.now()}.${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      await writeFile(filepath, Buffer.from(await photo.arrayBuffer()));
      photoPath = `/uploads/pod/${filename}`;
    }

    // Merge new photo with any existing via photos
    function parsePaths(raw: string | null | undefined): string[] {
      if (!raw) return [];
      if (raw.startsWith("[")) { try { return JSON.parse(raw); } catch { return []; } }
      return [raw];
    }
    let podUploadValue: string | undefined;
    if (photoPath) {
      const existing = parsePaths(existingPodUpload);
      existing.push(photoPath);
      podUploadValue = JSON.stringify(existing);
    }

    const updated = await prisma.viaAddress.update({
      where: { id: viaId },
      data: {
        signedBy,
        podTime: time,
        podDate,
        podRelationship: relationship,
        deliveredTemp: temperature,
        notes: notes ?? via.notes,
        viaPodMobile: true,
      },
      select: { id: true, signedBy: true, podTime: true },
    });

    // Write podUpload separately via raw SQL (generated client may not have this field yet)
    if (podUploadValue) {
      await prisma.$executeRaw`UPDATE via_addresses SET podUpload = ${podUploadValue} WHERE id = ${viaId}`;
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
