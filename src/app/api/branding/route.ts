import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// Public endpoint — no auth required (used on login page and sidebar)
export async function GET() {
  const settings = await prisma.settings.findFirst({
    select: { companyName: true, logo: true, menuLogo: true },
  });
  return NextResponse.json({
    companyName: settings?.companyName || "MP Transport",
    logo: settings?.logo || null,
    menuLogo: settings?.menuLogo || null,
  });
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { logo, menuLogo } = await req.json();
    const settings = await prisma.settings.findFirst();
    const data: Record<string, string | null> = {};
    if (logo !== undefined) data.logo = logo ?? null;
    if (menuLogo !== undefined) data.menuLogo = menuLogo ?? null;
    if (settings) {
      await prisma.settings.update({ where: { id: settings.id }, data });
    } else {
      await prisma.settings.create({ data: { id: "default-settings", ...data } });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
