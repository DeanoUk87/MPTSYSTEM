import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriverAuth } from "@/lib/api-auth";

// Temporary debug endpoint — shows exactly what the driver jobs query is using
// Visit: /api/driver/jobs/debug  (while logged in as the driver)
export async function GET(req: NextRequest) {
  const session = await requireDriverAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contact = await prisma.driverContact.findUnique({
    where: { id: session.dcontactId },
  });

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  const yesterdayStr = `${yest.getFullYear()}-${pad(yest.getMonth() + 1)}-${pad(yest.getDate())}`;

  // Find all bookings matching driver regardless of date, to see what's in DB
  const allBookings = contact ? await prisma.booking.findMany({
    where: {
      deletedAt: null,
      OR: [
        { driverId: contact.driverId },
        { secondManId: contact.driverId },
        { cxDriverId: contact.driverId },
        { driverContactId: contact.id },
      ],
    },
    select: {
      id: true, jobRef: true, collectionDate: true,
      driverId: true, secondManId: true, cxDriverId: true, driverContactId: true,
      podSignature: true,
    },
  }) : [];

  return NextResponse.json({
    session: { dcontactId: session.dcontactId },
    contact: contact ? { id: contact.id, driverId: contact.driverId, driverName: contact.driverName } : null,
    todayStr,
    yesterdayStr,
    serverTime: now.toISOString(),
    allMatchingBookings: allBookings,
  });
}
