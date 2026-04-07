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
    // GPS Live API call
    const url = `https://gpslive.co.uk/api/device?imei=${imei}&key=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 30 } });

    if (!res.ok) {
      return NextResponse.json({ error: "Tracking API unavailable", status: res.status }, { status: 502 });
    }

    const data = await res.json();

    // Normalise response to our schema
    return NextResponse.json({
      imei,
      lat: data.lat ?? data.latitude ?? null,
      lng: data.lng ?? data.longitude ?? null,
      temperature: data.temperature ?? data.temp ?? null,
      speed: data.speed ?? null,
      timestamp: data.timestamp ?? data.datetime ?? new Date().toISOString(),
      raw: data,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
