import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      vehicle: true,
      driver: true,
      secondMan: true,
      cxDriver: true,
      chillUnit: true,
      ambientUnit: true,
      bookingType: true,
      viaAddresses: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      geoTracking: true,
    },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(booking);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
  const body = await req.json();

  const { chillUnitId, ambientUnitId, driverId, viaAddresses: viaData,
          secondManContactId: _smc, cxDriverContactId: _cxc,
          deadMilesEnabled: _dme, deadMiles: _dm, ...rest } = body;

  const booking = await prisma.booking.update({
    where: { id },
    data: {
      ...rest,
      driverId: driverId || null,
      chillUnitId: chillUnitId || null,
      ambientUnitId: ambientUnitId || null,
      updatedById: (session as any).id,
    },
  });

  // Replace via addresses if provided
  if (Array.isArray(viaData)) {
    await prisma.viaAddress.deleteMany({ where: { bookingId: id } });
    for (const via of viaData) {
      if (!via.name && !via.postcode) continue;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, bookingId: _bid, createdAt: _ca, updatedAt: _ua, deletedAt: _da, collectedOrders: _co, ...viaFields } = via;
      await prisma.viaAddress.create({ data: { ...viaFields, bookingId: id } });
    }
  }

  // Update storage unit records when assigned
  for (const unitId of [chillUnitId, ambientUnitId].filter(Boolean)) {
    await prisma.storageUnit.update({
      where: { id: unitId as string },
      data: { trackable: 1, availability: "No", currentDriverId: driverId || null },
    }).catch(() => {/* non-critical */});
  }

  return NextResponse.json(booking);
  } catch (e: any) {
    console.error("Booking update error:", e);
    return NextResponse.json({ error: e.message || "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.booking.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}
