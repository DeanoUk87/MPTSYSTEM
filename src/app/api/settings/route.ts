import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await prisma.settings.findFirst();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const settings = await prisma.settings.findFirst();
  if (settings) {
    const updated = await prisma.settings.update({ where: { id: settings.id }, data: body });
    return NextResponse.json(updated);
  } else {
    const created = await prisma.settings.create({ data: { id: "default-settings", ...body } });
    return NextResponse.json(created);
  }
}
