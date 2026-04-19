import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriverAuth } from "@/lib/api-auth";

const BOOKING_SELECT = {
  id: true,
  jobRef: true,
  collectionDate: true,
  collectionTime: true,
  collectionName: true,
  collectionPostcode: true,
  deliveryName: true,
  deliveryPostcode: true,
  miles: true,
  podSignature: true,
  driverConfirmCollectionAt: true,
  chillUnit: { select: { unitNumber: true, unitType: true, temperature: true } },
  ambientUnit: { select: { unitNumber: true, unitType: true, temperature: true } },
  viaAddresses: {
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" as const },
    select: { id: true, postcode: true, name: true, signedBy: true },
  },
};

export async function GET(req: NextRequest) {
  const session = await requireDriverAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const contact = await prisma.driverContact.findUnique({
      where: { id: session.dcontactId },
    });
    if (!contact) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const bookings = await prisma.booking.findMany({
      where: {
        collectionDate: todayStr,
        deletedAt: null,
        OR: [
          { driverId: contact.driverId },
          { secondManId: contact.driverId },
          { cxDriverId: contact.driverId },
        ],
      },
      select: BOOKING_SELECT,
      orderBy: { collectionTime: "asc" },
    });

    return NextResponse.json(bookings);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
