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
  chillUnit: { select: { unitNumber: true, unitType: true, imei: true } },
  ambientUnit: { select: { unitNumber: true, unitType: true, imei: true } },
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

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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

    // Fetch live temperatures for all units across all bookings
    const apiKey = process.env.LIVE_DEVICE_API;
    const useMock = process.env.GPSLIVE_USE_MOCK === "true";
    async function fetchTemp(imei: string | null): Promise<string | null> {
      if (!imei) return null;
      if (useMock || !apiKey) return ((2 + Math.random() * 2).toFixed(1));
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

    // Collect unique IMEIs to avoid duplicate API calls
    const imeiSet = new Set<string>();
    for (const b of bookings) {
      if ((b.chillUnit as any)?.imei) imeiSet.add((b.chillUnit as any).imei);
      if ((b.ambientUnit as any)?.imei) imeiSet.add((b.ambientUnit as any).imei);
    }
    const tempMap: Record<string, string | null> = {};
    await Promise.all([...imeiSet].map(async imei => { tempMap[imei] = await fetchTemp(imei); }));

    const enriched = bookings.map(b => ({
      ...b,
      chillUnit: b.chillUnit ? { ...b.chillUnit, temperature: tempMap[(b.chillUnit as any).imei] ?? null } : null,
      ambientUnit: b.ambientUnit ? { ...b.ambientUnit, temperature: tempMap[(b.ambientUnit as any).imei] ?? null } : null,
    }));

    return NextResponse.json(enriched);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
