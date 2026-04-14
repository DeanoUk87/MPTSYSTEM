import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const settings = await prisma.settings.findFirst();
    return NextResponse.json(settings ?? {});
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth(req);
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
