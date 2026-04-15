import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const availability = searchParams.get("availability");

  try {
    const units = await prisma.storageUnit.findMany({
      where: availability ? { availability } : undefined,
      include: { currentDriver: { select: { id: true, name: true } } },
      orderBy: { unitNumber: "asc" },
    });
    return NextResponse.json(units);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const unit = await prisma.storageUnit.create({
      data: {
        unitNumber: body.unitNumber,
        imei: body.imei || null,
        unitSize: body.unitSize || null,
        unitType: body.unitType || null,
        availability: body.availability || "Yes",
        calibrationDate: body.calibrationDate || null,
        trackable: body.trackable ?? 0,
      },
    });
    return NextResponse.json(unit, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
