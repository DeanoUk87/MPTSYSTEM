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
  const body = await req.json();

  const { chillUnitId, ambientUnitId, driverId, viaAddresses: _, ...rest } = body;

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
  return NextResponse.json(booking);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.booking.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
