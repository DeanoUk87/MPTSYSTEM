import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Ensure "Quote" booking type exists
  await prisma.bookingType.upsert({ where: { name: "Quote" }, update: {}, create: { name: "Quote" } });
  const types = await prisma.bookingType.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(types);
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name } = await req.json();
  const type = await prisma.bookingType.create({ data: { name } });
  return NextResponse.json(type, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.bookingType.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
