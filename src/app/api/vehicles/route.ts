import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const vehicles = await prisma.vehicle.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const vehicle = await prisma.vehicle.create({
    data: {
      name: body.name,
      costPerMile: parseFloat(body.costPerMile) || 0,
      driverId: body.driverId || null,
      userId: (session as any).id,
    },
  });
  return NextResponse.json(vehicle, { status: 201 });
}
