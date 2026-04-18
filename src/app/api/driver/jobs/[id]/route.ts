import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriverAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireDriverAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const contact = await prisma.driverContact.findUnique({ where: { id: session.dcontactId } });
    if (!contact) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

    const booking = await prisma.booking.findFirst({
      where: { id, secondManId: contact.driverId, driverContactId: contact.id, deletedAt: null },
      select: {
        id: true,
        jobRef: true,
        collectionDate: true,
        collectionTime: true,
        collectionName: true,
        collectionAddress1: true,
        collectionPostcode: true,
        collectionNotes: true,
        deliveryName: true,
        deliveryAddress1: true,
        deliveryPostcode: true,
        deliveryNotes: true,
        deliveryTime: true,
        purchaseOrder: true,
        jobNotes: true,
        officeNotes: true,
        miles: true,
        numberOfItems: true,
        weight: true,
        podSignature: true,
        podTime: true,
        podDate: true,
        podUpload: true,
        podRelationship: true,
        deliveredTemperature: true,
        driverNote: true,
        driverConfirmCollectionAt: true,
        chillUnit: { select: { unitNumber: true, unitType: true } },
        ambientUnit: { select: { unitNumber: true, unitType: true } },
        customer: { select: { name: true } },
        viaAddresses: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            name: true,
            address1: true,
            postcode: true,
            notes: true,
            signedBy: true,
            podDate: true,
            podTime: true,
            podRelationship: true,
            deliveredTemp: true,
            viaPodMobile: true,
          },
        },
      },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    return NextResponse.json(booking);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
