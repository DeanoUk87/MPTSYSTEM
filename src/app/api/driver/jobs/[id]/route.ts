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
      where: { id, deletedAt: null, OR: [{ driverId: contact.driverId }, { secondManId: contact.driverId }, { cxDriverId: contact.driverId }] },
      select: {
        id: true,
        jobRef: true,
        collectionDate: true,
        collectionTime: true,
        collectionName: true,
        collectionAddress1: true,
        collectionPostcode: true,
        collectionContact: true,
        collectionPhone: true,
        collectionNotes: true,
        deliveryName: true,
        deliveryAddress1: true,
        deliveryPostcode: true,
        deliveryContact: true,
        deliveryPhone: true,
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
        chillUnit: { select: { unitNumber: true, unitType: true, imei: true } },
        ambientUnit: { select: { unitNumber: true, unitType: true, imei: true } },
        customer: { select: { name: true } },
        viaAddresses: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            name: true,
            address1: true,
            postcode: true,
            contact: true,
            phone: true,
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

    // Fetch live temperatures for assigned units
    const apiKey = process.env.LIVE_DEVICE_API;
    const useMock = process.env.GPSLIVE_USE_MOCK === "true";
    async function fetchTemp(imei: string | null): Promise<string | null> {
      if (!imei) return null;
      if (useMock || !apiKey) {
        return ((2 + Math.random() * 2).toFixed(1));
      }
      try {
        const res = await fetch("https://api.gpslive.app/v1/devices/sensor-values", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const json = await res.json();
        const all = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
        const device = all.find((d: any) => String(d.imei) === String(imei));
        if (!device) return null;
        const tSensor = device?.sensors?.find((s: any) => /temperature/i.test(s.name ?? ""));
        if (tSensor?.data?.computed_value != null) return String(tSensor.data.computed_value);
        if (device?.objectData?.data?.params?.temp1 != null)
          return (parseFloat(device.objectData.data.params.temp1) / 10).toFixed(1);
        return null;
      } catch { return null; }
    }

    const [chillTemp, ambientTemp] = await Promise.all([
      fetchTemp((booking.chillUnit as any)?.imei ?? null),
      fetchTemp((booking.ambientUnit as any)?.imei ?? null),
    ]);

    const result = {
      ...booking,
      chillUnit: booking.chillUnit ? { ...booking.chillUnit, temperature: chillTemp } : null,
      ambientUnit: booking.ambientUnit ? { ...booking.ambientUnit, temperature: ambientTemp } : null,
    };

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
