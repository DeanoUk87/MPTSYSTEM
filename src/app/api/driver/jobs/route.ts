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

    // Build today's date string — also cover yesterday to handle timezone edge cases
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    // Also include yesterday so jobs don't vanish at midnight
    const yest = new Date(now); yest.setDate(yest.getDate() - 1);
    const yesterdayStr = `${yest.getFullYear()}-${pad(yest.getMonth() + 1)}-${pad(yest.getDate())}`;

    const bookings = await prisma.booking.findMany({
      where: {
        collectionDate: { in: [todayStr, yesterdayStr] },
        deletedAt: null,
        OR: [
          { driverId: contact.driverId },
          { secondManId: contact.driverId },
          { cxDriverId: contact.driverId },
          { driverContactId: contact.id },
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
