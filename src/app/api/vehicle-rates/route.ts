import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const vehicleId = searchParams.get("vehicleId");

  const rates = await prisma.customerVehicleRate.findMany({
    where: {
      ...(customerId ? { customerId } : {}),
      ...(vehicleId ? { vehicleId } : {}),
    },
    include: {
      vehicle: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(rates);
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const rate = await prisma.customerVehicleRate.upsert({
    where: { customerId_vehicleId: { customerId: body.customerId, vehicleId: body.vehicleId } },
    update: {
      ratePerMile: parseFloat(body.ratePerMile) || 0,
      ratePerMileWeekends: parseFloat(body.ratePerMileWeekends) || 0,
      ratePerMileOutOfHours: parseFloat(body.ratePerMileOutOfHours) || 0,
    },
    create: {
      customerId: body.customerId,
      vehicleId: body.vehicleId,
      ratePerMile: parseFloat(body.ratePerMile) || 0,
      ratePerMileWeekends: parseFloat(body.ratePerMileWeekends) || 0,
      ratePerMileOutOfHours: parseFloat(body.ratePerMileOutOfHours) || 0,
    },
  });
  return NextResponse.json(rate);
}

export async function DELETE(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.customerVehicleRate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
