import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        vehicleRates: { include: { vehicle: true } },
        _count: { select: { bookings: true } },
      },
    });
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // jobRefStart not in generated DMMF — fetch via raw SQL
    const extra = await prisma.$queryRaw<{ jobRefStart: number }[]>`SELECT "jobRefStart" FROM "customers" WHERE "id" = ${id} LIMIT 1`;
    return NextResponse.json({ ...customer, jobRefStart: extra[0]?.jobRefStart ?? 1 });
  } catch (e: any) {
    console.error("Customer GET error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { vehicleRates: _, _count: __, ...data } = body;
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        accountNumber: data.accountNumber || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        address2: data.address2 || null,
        address3: data.address3 || null,
        city: data.city || null,
        postcode: data.postcode || null,
        notes: data.notes || null,
        contact: data.contact || null,
        poNumber: data.poNumber || null,
        poEmail: data.poEmail || null,
        deadMileage: parseInt(data.deadMileage) || 0,
        customerAccount: data.customerAccount || null,
        termsOfPayment: data.termsOfPayment || null,
      },
    });
    // jobRefStart not in generated DMMF yet — update via raw SQL
    const jrs = parseInt(data.jobRefStart) || 1;
    await prisma.$executeRaw`UPDATE "customers" SET "jobRefStart" = ${jrs} WHERE "id" = ${id}`;
    return NextResponse.json({ ...customer, jobRefStart: jrs });
  } catch (e: any) {
    console.error("Customer update error:", e);
    return NextResponse.json({ error: e.message || "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
