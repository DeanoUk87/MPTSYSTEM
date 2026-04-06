import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const driverId = searchParams.get("driverId");
  const status = searchParams.get("status");
  const date = searchParams.get("date");

  const where: any = {};
  if (customerId) where.customerId = customerId;
  if (driverId) where.driverId = driverId;
  if (status !== null && status !== "") where.jobStatus = parseInt(status);
  if (date) where.collectionDate = date;

  // Customer role scoping
  const user = session as any;
  if (user.roles?.includes("customer") && user.customerId) {
    where.customerId = user.customerId;
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, accountNumber: true } },
      vehicle: { select: { id: true, name: true } },
      driver: { select: { id: true, name: true, driverType: true } },
      secondMan: { select: { id: true, name: true } },
      bookingType: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { chillUnitId, ambientUnitId, driverId, ...rest } = body;

  const booking = await prisma.booking.create({
    data: {
      ...rest,
      driverId: driverId || null,
      chillUnitId: chillUnitId || null,
      ambientUnitId: ambientUnitId || null,
      createdById: (session as any).id,
    },
  });

  // Allocate storage units
  for (const unitId of [chillUnitId, ambientUnitId].filter(Boolean)) {
    const unit = await prisma.storageUnit.findUnique({ where: { id: unitId } });
    if (unit && unit.availability === "Yes" && driverId) {
      await prisma.storageUnit.update({
        where: { id: unitId },
        data: { availability: "No", currentDriverId: driverId, jobId: booking.id, trackable: 1 },
      });
    } else if (unit) {
      await prisma.storageUnit.update({ where: { id: unitId }, data: { trackable: 1 } });
    }
    if (unitId) {
      await prisma.storageUsage.create({
        data: { unitId, jobId: booking.id, driverId: driverId || null },
      });
    }
  }

  return NextResponse.json(booking, { status: 201 });
}
