import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { statSync } from "fs";
import { existsSync } from "fs";
import path from "path";

// POST /api/pod-manager/import-booking
// body: { bookingId: string, folderId?: string }
// Registers existing booking POD files into the POD Manager without moving them
export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { bookingId, folderId } = body;

  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        podUpload: true,
        customerId: true,
        deliveryPostcode: true,
        jobRef: true,
        viaAddresses: {
          where: { deletedAt: null },
          select: { id: true, postcode: true },
        },
      },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    function parsePaths(raw: string | null | undefined): string[] {
      if (!raw) return [];
      if (raw.startsWith("[")) { try { return JSON.parse(raw); } catch { return []; } }
      return [raw];
    }

    const allFiles: { filePath: string; bookingId: string }[] = [
      ...parsePaths(booking.podUpload).map(fp => ({ filePath: fp, bookingId: booking.id })),
    ];

    // Also include via address POD files via raw query
    for (const via of booking.viaAddresses) {
      const rawVia = await prisma.$queryRaw<{ podUpload: string | null }[]>`
        SELECT podUpload FROM via_addresses WHERE id = ${via.id} LIMIT 1
      `;
      const viaPaths = parsePaths(rawVia[0]?.podUpload);
      viaPaths.forEach(fp => allFiles.push({ filePath: fp, bookingId: booking.id }));
    }

    if (allFiles.length === 0) return NextResponse.json({ imported: 0, message: "No POD files on this booking" });

    // Check which are already imported
    const existing = await prisma.podFile.findMany({
      where: { bookingId: booking.id, deletedAt: null },
      select: { filePath: true },
    });
    const existingPaths = new Set(existing.map(e => e.filePath));

    const toImport = allFiles.filter(f => !existingPaths.has(f.filePath));
    let imported = 0;

    for (const f of toImport) {
      const physPath = path.join(process.cwd(), "public", f.filePath);
      if (!existsSync(physPath)) continue;
      let fileSize = 0;
      try { fileSize = statSync(physPath).size; } catch {}

      const storedName = f.filePath.split("/").pop() || f.filePath;
      const ext = storedName.split(".").pop()?.toLowerCase() ?? "jpg";
      const mimeType = ["pdf"].includes(ext) ? "application/pdf" : `image/${ext === "jpg" ? "jpeg" : ext}`;

      await prisma.podFile.create({
        data: {
          folderId: folderId || null,
          bookingId: f.bookingId,
          filename: storedName,
          storedName,
          filePath: f.filePath,
          mimeType,
          fileSize,
          customerId: booking.customerId || null,
          uploadedById: session.id,
        },
      });
      imported++;
    }

    return NextResponse.json({ imported, total: allFiles.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
