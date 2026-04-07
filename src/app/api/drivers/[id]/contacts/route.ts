import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { driverName, vehicleMake, vehicleRegistration, driverPhone } = await req.json();
  if (!driverName) return NextResponse.json({ error: "driverName required" }, { status: 400 });

  const contact = await prisma.driverContact.create({
    data: { driverId: id, driverName, vehicleMake: vehicleMake || null, vehicleRegistration: vehicleRegistration || null, driverPhone: driverPhone || null },
  });
  return NextResponse.json(contact, { status: 201 });
}
