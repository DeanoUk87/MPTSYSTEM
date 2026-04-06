import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const unit = await prisma.storageUnit.update({
    where: { id },
    data: {
      unitNumber: body.unitNumber,
      imei: body.imei || null,
      unitSize: body.unitSize || null,
      unitType: body.unitType || null,
      availability: body.availability,
      calibrationDate: body.calibrationDate || null,
      currentDriverId: body.currentDriverId || null,
      trackable: body.trackable ?? 0,
    },
  });
  return NextResponse.json(unit);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.storageUnit.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
