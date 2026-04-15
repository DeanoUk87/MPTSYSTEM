import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// Public endpoint — no auth required (used on login page and sidebar)
export async function GET() {
  try {
    const s = await prisma.settings.findFirst({
      select: { companyName: true, logo: true, menuLogo: true },
    });
    return NextResponse.json({
      companyName: (s as any)?.companyName || "MP Transport",
      logo: (s as any)?.logo || null,
      menuLogo: (s as any)?.menuLogo || null,
    });
  } catch {
    return NextResponse.json({ companyName: "MP Transport", logo: null, menuLogo: null });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { logo, menuLogo } = await req.json();
    const logoVal = logo ?? null;
    const menuLogoVal = menuLogo ?? null;
    const existing = await prisma.settings.findFirst();
    if (existing) {
      await prisma.settings.update({
        where: { id: existing.id },
        data: { logo: logoVal, menuLogo: menuLogoVal } as any,
      });
    } else {
      await prisma.settings.create({
        data: {
          id: "default-settings",
          companyName: "",
          logo: logoVal,
          menuLogo: menuLogoVal,
          baseCurrency: "GBP",
          invoiceDueDate: 30,
          sendLimit: 50,
        } as any,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
