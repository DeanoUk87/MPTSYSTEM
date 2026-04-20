import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session as any;
  if (!user.customerId) return NextResponse.json({ error: "Not a customer account" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const today = new Date().toISOString().split("T")[0];
  const dateFrom = searchParams.get("dateFrom") || today;
  const dateTo = searchParams.get("dateTo") || today;

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        customerId: user.customerId,
        collectionDate: { gte: dateFrom, lte: dateTo },
        deletedAt: null,
      },
      include: {
        vehicle: { select: { name: true } },
        driver: { select: { name: true } },
        secondMan: { select: { name: true } },
        chillUnit: { select: { id: true, unitNumber: true, unitType: true, imei: true } },
        ambientUnit: { select: { id: true, unitNumber: true, unitType: true, imei: true } },
        viaAddresses: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      },
      orderBy: [{ createdAt: "desc" }],
    });
    return NextResponse.json(bookings);
  } catch (e: any) {
    console.error("Portal bookings GET error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
