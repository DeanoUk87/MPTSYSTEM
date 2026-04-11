import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      vehicleRates: { include: { vehicle: true } },
      _count: { select: { bookings: true } },
    },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { vehicleRates: _, _count: __, ...data } = body;
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
      jobRefStart: parseInt(data.jobRefStart) || 1,
      customerAccount: data.customerAccount || null,
      termsOfPayment: data.termsOfPayment || null,
    },
  });
  return NextResponse.json(customer);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
