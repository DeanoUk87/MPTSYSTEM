import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { origin, destination, avoidTolls } = await req.json();
  if (!origin || !destination) return NextResponse.json({ error: "origin and destination required" }, { status: 400 });

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ miles: 0, duration: "N/A", note: "Configure GOOGLE_API_KEY for live distances" });
  }

  try {
    const avoid = avoidTolls ? "&avoid=tolls" : "";
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&units=imperial${avoid}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    const element = data?.rows?.[0]?.elements?.[0];
    if (element?.status !== "OK") {
      return NextResponse.json({ miles: 0, duration: "N/A" });
    }

    // Distance returned in metres, convert to miles and round to nearest whole number
    const metres = element.distance.value;
    const miles = Math.round(metres / 1609.344);
    const duration = element.duration.text;

    return NextResponse.json({ miles, duration });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
