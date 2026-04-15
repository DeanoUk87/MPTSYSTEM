import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
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
        viaAddresses: { orderBy: { createdAt: "asc" } },
        geoTracking: true,
      },
    });
    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(booking);
  } catch (e: any) {
    console.error("Booking GET error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
  const body = await req.json();

  const { chillUnitId, ambientUnitId, driverId, viaAddresses: viaData,
          secondManContactId: _smc, cxDriverContactId: _cxc,
          deadMilesEnabled: _dme, deadMiles: _dm,
          // Strip nested relation objects returned by GET — Prisma rejects these in .update()
          customer: _cust, driver: _drv, secondMan: _sm, cxDriver: _cx,
          bookingType: _bt, vehicle: _veh, chillUnit: _chu, ambientUnit: _abu,
          geoTracking: _gt, podUpload: _pu,
          id: _id, createdAt: _ca, updatedAt: _ua, deletedAt: _da, jobRef: _jr,
          ...rest } = body;

  // Load current booking so we can detect which units are being removed
  const existing = await prisma.booking.findUnique({
    where: { id },
    select: { chillUnitId: true, ambientUnitId: true },
  });

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

  // Handle units being REMOVED from this booking — reset them
  const oldUnits = [existing?.chillUnitId, existing?.ambientUnitId].filter(Boolean) as string[];
  const newUnits = [chillUnitId, ambientUnitId].filter(Boolean) as string[];
  const removedUnits = oldUnits.filter(uid => !newUnits.includes(uid));
  for (const uid of removedUnits) {
    await prisma.storageUnit.update({
      where: { id: uid },
      data: { trackable: 0, availability: "Yes", currentDriverId: null, jobId: null },
    }).catch(() => {});
  }

  // Update storage unit records for currently-assigned units
  for (const unitId of newUnits) {
    if (driverId) {
      // Driver + unit: enable tracking
      await prisma.storageUnit.update({
        where: { id: unitId },
        data: { trackable: 1, availability: "No", currentDriverId: driverId, jobId: id },
      }).catch(() => {});
    } else {
      // Unit assigned but no driver — unavailable, tracking OFF
      await prisma.storageUnit.update({
        where: { id: unitId },
        data: { trackable: 0, availability: "No", currentDriverId: null },
      }).catch(() => {});
    }
  }

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

  // Reset any storage units assigned to this booking before soft-deleting
  const bookingToDelete = await prisma.booking.findUnique({
    where: { id },
    select: { chillUnitId: true, ambientUnitId: true },
  });
  for (const uid of [bookingToDelete?.chillUnitId, bookingToDelete?.ambientUnitId].filter(Boolean) as string[]) {
    await prisma.storageUnit.update({
      where: { id: uid },
      data: { trackable: 0, availability: "Yes", currentDriverId: null, jobId: null },
    }).catch(() => {});
  }

  // Raw SQL for soft delete (deletedAt not in generated DMMF until next rebuild)
  await prisma.$executeRaw`UPDATE "bookings" SET "deletedAt" = datetime('now') WHERE "id" = ${id}`;
  return NextResponse.json({ success: true });
}
