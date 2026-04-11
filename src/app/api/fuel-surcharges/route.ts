import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.fuelSurcharge.findMany({ orderBy: { price: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { price, percentage } = await req.json();
  const item = await prisma.fuelSurcharge.create({ data: { price, percentage } });
  return NextResponse.json(item);
}
