import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; contactId: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { contactId } = await params;
  const { driverName, vehicleMake, vehicleRegistration, driverPhone, email } = await req.json();
  const contact = await prisma.driverContact.update({
    where: { id: contactId },
    data: { driverName, vehicleMake: vehicleMake || null, vehicleRegistration: vehicleRegistration || null, driverPhone: driverPhone || null, email: email || null },
  });
  return NextResponse.json(contact);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; contactId: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { contactId } = await params;
  await prisma.driverContact.update({ where: { id: contactId }, data: { deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}
