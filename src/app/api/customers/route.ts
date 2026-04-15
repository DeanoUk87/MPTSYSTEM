import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || searchParams.get("q");

  try {
    const customers = await prisma.customer.findMany({
      where: search ? {
        OR: [
          { name: { contains: search } },
          { accountNumber: { contains: search } },
          { customerAccount: { contains: search } },
        ],
      } : undefined,
      orderBy: { name: "asc" },
      include: { _count: { select: { bookings: true } } },
    });
    const usersWithCustomer = await prisma.user.findMany({
      where: { customerId: { not: null } },
      select: { customerId: true },
    });
    const accessSet = new Set(usersWithCustomer.map(u => u.customerId));
    const result = customers.map(c => ({ ...c, hasLoginAccess: accessSet.has(c.id) }));
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("Customers GET error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  try {
    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        accountNumber: body.accountNumber || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        address2: body.address2 || null,
        address3: body.address3 || null,
        city: body.city || null,
        postcode: body.postcode || null,
        notes: body.notes || null,
        contact: body.contact || null,
        poNumber: body.poNumber || null,
        poEmail: body.poEmail || null,
        deadMileage: parseInt(body.deadMileage) || 0,
        // Legacy invoice fields
        customerAccount: body.customerAccount || null,
        termsOfPayment: body.termsOfPayment || null,
        userId: (session as any).id,
        jobRefStart: parseInt(body.jobRefStart) || 1,
      } as any,
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (e: any) {
    console.error("Customer create error:", e);
    return NextResponse.json({ error: e.message || "Failed to create customer" }, { status: 500 });
  }
}
