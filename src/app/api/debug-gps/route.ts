import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// Debug endpoint: calls GPSLive with the first unit that has an IMEI and returns the raw response
// Usage: GET /api/debug-gps
export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.LIVE_DEVICE_API;
  if (!apiKey) return NextResponse.json({ error: "LIVE_DEVICE_API not set" }, { status: 400 });

  const unit = await prisma.storageUnit.findFirst({ where: { imei: { not: null } } });
  if (!unit) return NextResponse.json({ error: "No units with IMEI found" }, { status: 404 });

  // The real API is api.gpslive.app with Bearer auth (from old Laravel StorageService)
  const IMEI = unit.imei;
  const KEY = apiKey;
  const urlsToTry = [
    `https://api.gpslive.app/v1/devices/sensor-values`,  // temperature + ignition
    `https://api.gpslive.app/v1/devices`,                // positions + objectData
  ];

  const results: any[] = [];
  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, { cache: "no-store", headers: { Authorization: `Bearer ${KEY}` } });
      const rawText = await res.text();
      let parsed = null;
      let parseError = null;
      try { parsed = JSON.parse(rawText); } catch (e: any) { parseError = e.message; }
      results.push({
        url,
        httpStatus: res.status,
        contentType: res.headers.get("content-type"),
        rawText: rawText.slice(0, 500), // first 500 chars
        parsed,
        parseError,
      });
    } catch (e: any) {
      results.push({ url, fetchError: e.message });
    }
  }

  return NextResponse.json({
    unit: { id: unit.id, unitNumber: unit.unitNumber, imei: unit.imei, unitType: unit.unitType },
    results,
  });
}
