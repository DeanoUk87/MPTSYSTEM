import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriverAuth } from "@/lib/api-auth";

// Add HH:MM time string + seconds, returns HH:MM string
function addSecondsToTime(hhmm: string, seconds: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 3600 + m * 60 + seconds;
  const rh = Math.floor((total % 86400) / 3600);
  const rm = Math.floor((total % 3600) / 60);
  return `${String(rh).padStart(2, "0")}:${String(rm).padStart(2, "0")}`;
}

async function getDriveDurationSeconds(origin: string, destination: string): Promise<number | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || !origin || !destination) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}&units=imperial`;
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();
    const duration = json?.rows?.[0]?.elements?.[0]?.duration?.value; // seconds
    return typeof duration === "number" ? duration : null;
  } catch {
    return null;
  }
}

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
      where: {
        id, deletedAt: null,
        OR: [
          { driverId: contact.driverId },
          { secondManId: contact.driverId },
          { cxDriverId: contact.driverId },
          { driverContactId: contact.id },
        ],
      },
      select: {
        id: true,
        collectionPostcode: true,
        deliveryPostcode: true,
        viaAddresses: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
          select: { id: true, postcode: true },
        },
      },
    });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Build ordered waypoints: collection → via1 → via2 → ... → final delivery
    const waypoints = [
      booking.collectionPostcode,
      ...booking.viaAddresses.filter(v => v.postcode).map(v => v.postcode!),
      booking.deliveryPostcode,
    ].filter(Boolean) as string[];

    // Get drive duration for each leg sequentially
    const legDurations: (number | null)[] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      legDurations.push(await getDriveDurationSeconds(waypoints[i], waypoints[i + 1]));
    }

    // Calculate cumulative ETAs: each stop = previous ETA + drive time + 30 min buffer
    let runningTime = time;
    const viaETAs: string[] = [];
    for (let i = 0; i < booking.viaAddresses.length; i++) {
      const legSecs = legDurations[i];
      if (legSecs !== null) {
        runningTime = addSecondsToTime(runningTime, legSecs + 30 * 60);
      }
      viaETAs.push(legSecs !== null ? runningTime : "");
    }

    // Final delivery ETA
    const lastLegSecs = legDurations[legDurations.length - 1];
    let estimatedDeliveryTime: string | null = null;
    if (lastLegSecs !== null) {
      estimatedDeliveryTime = addSecondsToTime(runningTime, lastLegSecs + 30 * 60);
    }

    // Update viaTime for each via address that has an ETA
    for (let i = 0; i < booking.viaAddresses.length; i++) {
      if (viaETAs[i]) {
        await prisma.viaAddress.update({
          where: { id: booking.viaAddresses[i].id },
          data: { viaTime: viaETAs[i] },
        });
      }
    }

    // Update collectionTime to driver's confirmed time, set driverConfirmCollectionAt, and set delivery ETA
    const updateData: Record<string, any> = {
      collectionTime: time,
      driverConfirmCollectionAt: new Date(),
    };
    if (estimatedDeliveryTime) {
      updateData.deliveryTime = estimatedDeliveryTime;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
      select: { id: true, collectionTime: true, driverConfirmCollectionAt: true, deliveryTime: true },
    });

    return NextResponse.json({ ...updated, estimatedDeliveryTime });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
