import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session as any;
  if (!user.driverId) return NextResponse.json({ error: "Not a driver account" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const today = new Date().toISOString().split("T")[0];
  const dateFrom = searchParams.get("dateFrom") || today;
  const dateTo = searchParams.get("dateTo") || today;

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { driverId: user.driverId },
          { secondManId: user.driverId },
          { cxDriverId: user.driverId },
        ],
        collectionDate: { gte: dateFrom, lte: dateTo },
        deletedAt: null,
      },
      select: {
        id: true,
        jobRef: true,
        collectionDate: true,
        collectionPostcode: true,
        collectionName: true,
        deliveryPostcode: true,
        deliveryName: true,
        driverCost: true,
        extraCost: true,
        viaAddresses: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
          select: { id: true, postcode: true, name: true },
        },
      },
      orderBy: [{ collectionDate: "asc" }, { collectionTime: "asc" }],
    });
    return NextResponse.json(bookings);
  } catch (e: any) {
    console.error("Driver portal bookings GET error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
