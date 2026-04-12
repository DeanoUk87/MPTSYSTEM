import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { origin, destination, avoidTolls, waypoints } = await req.json();
  if (!origin || !destination) return NextResponse.json({ error: "origin and destination required" }, { status: 400 });

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ miles: 0, duration: "N/A", note: "Configure GOOGLE_API_KEY for live distances" });
  }

  const avoid = avoidTolls ? "&avoid=tolls" : "";

  try {
    // Use Directions API when via waypoints are present (supports multi-stop routing)
    if (waypoints && waypoints.length > 0) {
      const waypointStr = waypoints.map((w: string) => encodeURIComponent(w)).join("|");
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&waypoints=${waypointStr}${avoid}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status !== "OK") return NextResponse.json({ miles: 0, duration: "N/A" });
      const route = data.routes[0];
      const totalMetres = route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0);
      const totalSeconds = route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0);
      const miles = Math.round(totalMetres / 1609.344);
      const hours = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const duration = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;
      return NextResponse.json({ miles, duration });
    }

    // Standard two-point Distance Matrix
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
