import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// Fetch live temperature for all trackable units
export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.LIVE_DEVICE_API;
  const useMock = process.env.GPSLIVE_USE_MOCK === "true";

  // Get all trackable units — with real GPS: IMEI required; otherwise all
  const units = await prisma.storageUnit.findMany({
    where: (useMock || !apiKey) ? { trackable: 1 } : { trackable: 1, imei: { not: null } },
    include: { currentDriver: { select: { name: true } } },
  });

  if (units.length === 0) return NextResponse.json([]);

  const results = await Promise.all(
    units.map(async (unit) => {
      // Mock mode, or no API key, or unit has no IMEI → generate demo temperature
      if (useMock || !apiKey || !unit.imei) {
        const type = (unit.unitType || "chill").toLowerCase();
        // Always out-of-range so the alert system is demonstrable
        const temp = type === "ambient"
          ? (26 + Math.random() * 3).toFixed(1)   // 26–29°C  (ambient upper limit is 25°C)
          : type === "frozen"
          ? (-22 + Math.random() * 2).toFixed(1)  // -22–-20°C (frozen upper limit is -18°C)
          : (0.2 + Math.random() * 0.8).toFixed(1); // 0.2–1.0°C (chill lower limit is 2°C)
        return {
          id: unit.id,
          unitNumber: unit.unitNumber,
          imei: unit.imei,
          unitType: unit.unitType,
          availability: unit.availability,
          currentDriver: unit.currentDriver,
          temperature: temp,
          lat: 53.5 + (Math.random() - 0.5) * 0.05,
          lng: -1.15 + (Math.random() - 0.5) * 0.05,
          timestamp: new Date().toISOString(),
          mock: true,
        };
      }

      try {
        const res = await fetch(
          `https://gpslive.co.uk/api/device?imei=${unit.imei}&key=${apiKey}`,
          { next: { revalidate: 60 } }
        );
        const data = res.ok ? await res.json() : {};
        return {
          id: unit.id,
          unitNumber: unit.unitNumber,
          imei: unit.imei,
          unitType: unit.unitType,
          availability: unit.availability,
          currentDriver: unit.currentDriver,
          temperature: data.temperature ?? data.temp ?? null,
          lat: data.lat ?? data.latitude ?? null,
          lng: data.lng ?? data.longitude ?? null,
          timestamp: data.timestamp ?? new Date().toISOString(),
        };
      } catch {
        return { id: unit.id, unitNumber: unit.unitNumber, imei: unit.imei, temperature: null, lat: null, lng: null };
      }
    })
  );

  return NextResponse.json(results);
}
