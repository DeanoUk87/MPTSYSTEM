import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

// GPS Live tracking API — fetches live location + temperature by IMEI
export async function GET(req: NextRequest, { params }: { params: Promise<{ imei: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { imei } = await params;
  const apiKey = process.env.LIVE_DEVICE_API;
  const useMock = process.env.GPSLIVE_USE_MOCK === "true";

  if (useMock || !apiKey) {
    // Mock data for testing without live devices
    return NextResponse.json({
      imei,
      lat: 51.5074 + (Math.random() - 0.5) * 0.1,
      lng: -0.1278 + (Math.random() - 0.5) * 0.1,
      temperature: (Math.random() * 10 - 2).toFixed(1),
      speed: Math.floor(Math.random() * 60),
      timestamp: new Date().toISOString(),
      status: "mock",
    });
  }

  try {
    // GET /v1/devices — includes objectData.data with lat/lng and params.temp1
    // Auth: Bearer token in header
    const res = await fetch(`https://api.gpslive.app/v1/devices`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Tracking API unavailable", status: res.status }, { status: 502 });
    }

    const allDevices: any[] = await res.json().catch(() => []);
    const device = allDevices.find((d: any) => String(d.imei) === String(imei));

    if (!device) {
      return NextResponse.json({ error: "Device not found", imei }, { status: 404 });
    }

    const data = device.objectData?.data ?? {};
    const lat = data.latitude ?? null;
    const lng = data.longitude ?? null;

    // temp1 is stored ×10 (e.g. 206 = 20.6°C)
    const rawTemp = data.params?.temp1 ?? null;
    const temperature = rawTemp !== null ? (parseFloat(rawTemp) / 10).toFixed(1) : null;

    // Normalise response to our schema
    return NextResponse.json({
      imei,
      lat,
      lng,
      temperature,
      speed: data.speed ?? null,
      timestamp: data.dtTracker ?? new Date().toISOString(),
      raw: device,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
