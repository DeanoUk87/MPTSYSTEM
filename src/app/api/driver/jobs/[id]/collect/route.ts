import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriverAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireDriverAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const contact = await prisma.driverContact.findUnique({ where: { id: session.dcontactId } });
    if (!contact) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

    const { time } = await req.json();
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json({ error: "Invalid time format (HH:MM)" }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: { id, driverId: contact.driverId, deletedAt: null },
    });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        collectionTime: time,
        driverConfirmCollectionAt: new Date(),
      },
      select: { id: true, collectionTime: true, driverConfirmCollectionAt: true },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
