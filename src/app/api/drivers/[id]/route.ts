import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: { contacts: { where: { deletedAt: null } } },
  });
  if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(driver);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const driver = await prisma.driver.update({
    where: { id },
    data: {
      name: body.name,
      driverType: body.driverType,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      notes: body.notes || null,
      costPerMile: parseFloat(body.costPerMile) || 0,
      costPerMileWeekends: parseFloat(body.costPerMileWeekends) || 0,
      costPerMileOutOfHours: parseFloat(body.costPerMileOutOfHours) || 0,
    },
  });
  return NextResponse.json(driver);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.driver.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
