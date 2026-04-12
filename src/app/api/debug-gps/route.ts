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

  // GPSLive is an Angular SPA — every gpslive.co.uk URL returns HTML.
  // The JSON API must be on a separate host/subdomain.
  const IMEI = unit.imei;
  const KEY = apiKey;
  const urlsToTry = [
    // API subdomain variants
    `https://api.gpslive.co.uk/device?imei=${IMEI}&key=${KEY}`,
    `https://api.gpslive.co.uk/v1/device?imei=${IMEI}&key=${KEY}`,
    `https://api.gpslive.co.uk/devices/${IMEI}?key=${KEY}`,
    `https://api.gpslive.co.uk/track?imei=${IMEI}&key=${KEY}`,
    // Tracker subdomain
    `https://tracker.gpslive.co.uk/api/device?imei=${IMEI}&key=${KEY}`,
    // app subdomain
    `https://app.gpslive.co.uk/api/device?imei=${IMEI}&key=${KEY}`,
    // portal subdomain
    `https://portal.gpslive.co.uk/api/device?imei=${IMEI}&key=${KEY}`,
    // server subdomain
    `https://server.gpslive.co.uk/api/device?imei=${IMEI}&key=${KEY}`,
  ];

  const results: any[] = [];
  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, { cache: "no-store" });
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
