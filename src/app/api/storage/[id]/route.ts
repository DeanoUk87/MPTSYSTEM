import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const clearedDriver = body.currentDriverId !== undefined && !body.currentDriverId;
  const unit = await prisma.storageUnit.update({
    where: { id },
    data: {
      unitNumber: body.unitNumber,
      imei: body.imei || null,
      unitSize: body.unitSize || null,
      unitType: body.unitType || null,
      // If availability is explicitly provided use it; if driver is being cleared, reset to Yes
      availability: body.availability ?? (clearedDriver ? "Yes" : undefined),
      calibrationDate: body.calibrationDate || null,
      // Only update currentDriverId if it was explicitly sent in the request
      ...(body.currentDriverId !== undefined && { currentDriverId: body.currentDriverId || null }),
      // Preserve existing trackable state — only the booking system controls this
      ...(body.trackable !== undefined && { trackable: body.trackable }),
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
