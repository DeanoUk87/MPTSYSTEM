import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: { name: body.name, costPerMile: parseFloat(body.costPerMile) || 0, driverId: body.driverId || null },
  });
  return NextResponse.json(vehicle);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
