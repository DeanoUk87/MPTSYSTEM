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

function parsePaths(raw: string | null | undefined): string[] {
  if (!raw) return [];
  if (raw.startsWith("[")) { try { return JSON.parse(raw); } catch { return []; } }
  return [raw];
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
      where: { id, deletedAt: null, OR: [{ driverId: contact.driverId }, { secondManId: contact.driverId }, { cxDriverId: contact.driverId }] },
      select: { id: true },
    });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const via = await prisma.viaAddress.findFirst({
      where: { id: viaId, bookingId: id, deletedAt: null },
      select: { id: true, notes: true, viaPodMobile: true, signedBy: true, podTime: true },
    });
    if (!via) return NextResponse.json({ error: "Via stop not found" }, { status: 404 });

    // Idempotency guard — already submitted via mobile, return success so offline queue clears
    if (via.viaPodMobile) {
      return NextResponse.json({ id: via.id, signedBy: via.signedBy, podTime: via.podTime, alreadySubmitted: true });
    }

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
    const postcodeRaw = (formData.get("postcode") as string)?.trim() || null;

    // Accept multiple photos — formData.getAll returns all values for the "photo" key
    const photoFiles = (formData.getAll("photo") as File[]).filter(f => f && f.size > 0);

    if (!signedBy) return NextResponse.json({ error: "Signed by is required" }, { status: 400 });
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json({ error: "Invalid time format (HH:MM)" }, { status: 400 });
    }

    const today = new Date();
    const podDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    let podUploadValue: string | undefined;
    if (photoFiles.length > 0) {
      const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
      await ensureDir();
      const existing = parsePaths(existingPodUpload);

      // Build postcode-based prefix (sanitise for filesystem)
      const postcodePrefix = postcodeRaw
        ? postcodeRaw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
        : `VIA${viaId.slice(-4).toUpperCase()}`;

      // Determine starting index for #N suffix
      let photoIndex = existing.filter(f => f.includes(`/${postcodePrefix}`)).length + 1;

      for (const photo of photoFiles) {
        if (!allowed.includes(photo.type)) return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
        if (photo.size > 15 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 15 MB)" }, { status: 400 });

        const ext = photo.name.split(".").pop()?.toLowerCase() ?? "jpg";
        // Name: POSTCODE#1.jpg, POSTCODE#2.jpg etc.
        const filename = photoFiles.length === 1 && photoIndex === 1
          ? `${postcodePrefix}.${ext}`
          : `${postcodePrefix}#${photoIndex}.${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);
        await writeFile(filepath, Buffer.from(await photo.arrayBuffer()));
        existing.push(`/uploads/pod/${filename}`);
        photoIndex++;
      }

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
