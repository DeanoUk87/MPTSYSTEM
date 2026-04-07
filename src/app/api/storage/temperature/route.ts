import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// Fetch live temperature for all trackable units
export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.LIVE_DEVICE_API;
  const useMock = process.env.GPSLIVE_USE_MOCK === "true";

  // Get all trackable units with IMEIs
  const units = await prisma.storageUnit.findMany({
    where: { trackable: 1, imei: { not: null } },
    include: { currentDriver: { select: { name: true } } },
  });

  if (units.length === 0) return NextResponse.json([]);

  const results = await Promise.all(
    units.map(async (unit) => {
      if (!unit.imei) return { ...unit, temperature: null, lat: null, lng: null };

      if (useMock || !apiKey) {
        return {
          id: unit.id,
          unitNumber: unit.unitNumber,
          imei: unit.imei,
          unitType: unit.unitType,
          availability: unit.availability,
          currentDriver: unit.currentDriver,
          temperature: (Math.random() * 8 - 2).toFixed(1),
          lat: 51.5074 + (Math.random() - 0.5) * 0.05,
          lng: -0.1278 + (Math.random() - 0.5) * 0.05,
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
