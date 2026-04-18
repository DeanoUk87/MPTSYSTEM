import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const availability = searchParams.get("availability");

  try {
    const units = await prisma.storageUnit.findMany({
      where: availability ? { availability } : undefined,
      include: { currentDriver: { select: { id: true, name: true } } },
      orderBy: { unitNumber: "asc" },
    });

    // For units that belong to SubCon bookings, resolve the DriverContact name
    const unitIds = units.filter(u => u.currentDriverId).map(u => u.id);
    let driverContactMap: Record<string, string> = {};
    if (unitIds.length > 0) {
      const bookings = await prisma.booking.findMany({
        where: {
          deletedAt: null,
          driverContactId: { not: null },
          OR: [
            { chillUnitId: { in: unitIds } },
            { ambientUnitId: { in: unitIds } },
          ],
        },
        select: { chillUnitId: true, ambientUnitId: true, driverContactId: true },
      });
      const contactIds = [...new Set(bookings.map(b => b.driverContactId!))];
      if (contactIds.length > 0) {
        const contacts = await prisma.driverContact.findMany({
          where: { id: { in: contactIds } },
          select: { id: true, driverName: true },
        });
        const contactNameMap = Object.fromEntries(contacts.map(c => [c.id, c.driverName]));
        for (const b of bookings) {
          const name = contactNameMap[b.driverContactId!];
          if (name) {
            if (b.chillUnitId && unitIds.includes(b.chillUnitId)) driverContactMap[b.chillUnitId] = name;
            if (b.ambientUnitId && unitIds.includes(b.ambientUnitId)) driverContactMap[b.ambientUnitId] = name;
          }
        }
      }
    }

    const augmented = units.map(u => ({
      ...u,
      assignedDriverName: driverContactMap[u.id] || u.currentDriver?.name || null,
      isDriverContact: !!driverContactMap[u.id],
    }));

    return NextResponse.json(augmented);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const unit = await prisma.storageUnit.create({
      data: {
        unitNumber: body.unitNumber,
        imei: body.imei || null,
        unitSize: body.unitSize || null,
        unitType: body.unitType || null,
        availability: body.availability || "Yes",
        calibrationDate: body.calibrationDate || null,
        trackable: body.trackable ?? 0,
      },
    });
    return NextResponse.json(unit, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
