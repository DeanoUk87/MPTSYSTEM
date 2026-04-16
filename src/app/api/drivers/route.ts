import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // Driver | SubContractor | CXDriver
  const q = searchParams.get("q");

  try {
    const drivers = await prisma.driver.findMany({
      where: {
        ...(type ? { driverType: type } : {}),
        ...(q ? { name: { contains: q } } : {}),
      },
      include: { contacts: { where: { deletedAt: null } } },
      orderBy: { name: "asc" },
      ...(q ? { take: 20 } : {}),
    });

    // Attach hasAccess flags without schema changes
    const driverIds = drivers.map(d => d.id);
    const contactIds = drivers.flatMap(d => (d.contacts as any[]).map((c: any) => c.id));

    const [driverUsers, contactUsers] = await Promise.all([
      prisma.user.findMany({
        where: { driverId: { in: driverIds }, dcontactId: null },
        select: { driverId: true },
      }),
      contactIds.length > 0
        ? prisma.user.findMany({
            where: { dcontactId: { in: contactIds } },
            select: { dcontactId: true },
          })
        : Promise.resolve([]),
    ]);

    const driverAccessSet = new Set(driverUsers.map(u => u.driverId));
    const contactAccessSet = new Set(contactUsers.map(u => u.dcontactId));

    const result = drivers.map(d => ({
      ...d,
      hasAccess: driverAccessSet.has(d.id),
      contacts: (d.contacts as any[]).map((c: any) => ({
        ...c,
        hasAccess: contactAccessSet.has(c.id),
      })),
    }));

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("Drivers GET error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  try {
    const driver = await prisma.driver.create({
      data: {
        name: body.name,
        driverType: body.driverType || "Driver",
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        notes: body.notes || null,
        costPerMile: parseFloat(body.costPerMile) || 0,
        costPerMileWeekends: parseFloat(body.costPerMileWeekends) || 0,
        costPerMileOutOfHours: parseFloat(body.costPerMileOutOfHours) || 0,
        userId: (session as any).id,
      },
    });
    return NextResponse.json(driver, { status: 201 });
  } catch (e: any) {
    console.error("Driver create error:", e);
    return NextResponse.json({ error: e.message || "Failed to create driver" }, { status: 500 });
  }
}
