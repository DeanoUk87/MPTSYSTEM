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

  try {
    const url = `https://gpslive.co.uk/api/device?imei=${unit.imei}&key=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });
    const raw = res.ok ? await res.json() : null;
    return NextResponse.json({
      unit: { id: unit.id, unitNumber: unit.unitNumber, imei: unit.imei, unitType: unit.unitType },
      httpStatus: res.status,
      rawResponse: raw,
      fields: raw ? Object.keys(raw) : [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
