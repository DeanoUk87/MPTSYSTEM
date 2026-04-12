import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// Fetch live temperature for all trackable units
export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.LIVE_DEVICE_API;
  const useMock = process.env.GPSLIVE_USE_MOCK === "true";

  // Only monitor units that have a driver assigned AND are attached to an active booking.
  // Mock mode uses the trackable flag; real mode requires driver + booking.
  const activeBookingFilter = {
    OR: [
      { chillBookings: { some: { deletedAt: null } } },
      { ambientBookings: { some: { deletedAt: null } } },
    ],
  };
  const units = await prisma.storageUnit.findMany({
    where: (useMock || !apiKey)
      ? { trackable: 1 }
      : { imei: { not: null }, currentDriverId: { not: null }, ...activeBookingFilter },
    include: { currentDriver: { select: { name: true } } },
  });

  if (units.length === 0) return NextResponse.json([]);

  const results = await Promise.all(
    units.map(async (unit) => {
      // Mock mode, or no API key → generate demo temperature
      if (useMock || !apiKey) {
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

      // Real API mode but unit has no valid IMEI — skip silently
      if (!unit.imei) {
        return { id: unit.id, unitNumber: unit.unitNumber, imei: null, temperature: null, lat: null, lng: null };
      }

      try {
        // GET /v1/devices/sensor-values — returns all devices with sensor arrays
        // Auth: Bearer token in header (not query param)
        const res = await fetch(
          `https://api.gpslive.app/v1/devices/sensor-values`,
          { cache: "no-store", headers: { Authorization: `Bearer ${apiKey}` } }
        );
        const rawText = await res.text();
        let allDevices: any[] = [];
        try {
          const json = JSON.parse(rawText);
          // API may return plain array or { data: [...] }
          allDevices = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
        } catch { /* non-JSON — leave allDevices empty */ }

        // Find the device matching this unit's IMEI
        const device = allDevices.find((d: any) => String(d.imei) === String(unit.imei));

        // Extract temperature from sensors array (first sensor whose name contains "Temperature")
        let temp: string | null = null;
        if (device?.sensors) {
          const tSensor = device.sensors.find((s: any) => /temperature/i.test(s.name ?? ""));
          if (tSensor?.data?.computed_value != null) {
            temp = String(tSensor.data.computed_value);
          }
        }
        // Fallback: objectData.data.params.temp1 is stored ×10 (e.g. 206 = 20.6°C)
        if (temp === null && device?.objectData?.data?.params?.temp1 != null) {
          temp = (parseFloat(device.objectData.data.params.temp1) / 10).toFixed(1);
        }

        const lat = device?.objectData?.data?.latitude ?? device?.lat ?? null;
        const lng = device?.objectData?.data?.longitude ?? device?.lng ?? null;

        return {
          id: unit.id,
          unitNumber: unit.unitNumber,
          imei: unit.imei,
          unitType: unit.unitType,
          availability: unit.availability,
          currentDriver: unit.currentDriver,
          temperature: temp,
          lat: lat,
          lng: lng,
          timestamp: device?.objectData?.data?.dtTracker ?? new Date().toISOString(),
        };
      } catch {
        return { id: unit.id, unitNumber: unit.unitNumber, imei: unit.imei, temperature: null, lat: null, lng: null };
      }
    })
  );

  return NextResponse.json(results);
}
