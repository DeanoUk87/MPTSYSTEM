import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// Public endpoint — no auth required (used on login page and sidebar)
// Uses raw SQL to bypass stale Prisma generated client (menuLogo added via migration)
export async function GET() {
  try {
    const rows = await prisma.$queryRaw<{ companyName: string | null; logo: string | null; menuLogo: string | null }[]>`
      SELECT companyName, logo, menuLogo FROM "settings" LIMIT 1
    `;
    const s = rows[0];
    return NextResponse.json({
      companyName: s?.companyName || "MP Transport",
      logo: s?.logo || null,
      menuLogo: s?.menuLogo || null,
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
    // Raw SQL to bypass stale Prisma generated client
    const rows = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "settings" LIMIT 1`;
    if (rows.length) {
      await prisma.$executeRawUnsafe(
        `UPDATE "settings" SET "logo" = ?, "menuLogo" = ? WHERE "id" = ?`,
        logoVal, menuLogoVal, rows[0].id
      );
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "settings" ("id", "logo", "menuLogo", "companyName", "baseCurrency", "invoiceDueDate", "sendLimit") VALUES (?, ?, ?, '', 'GBP', 30, 50)`,
        "default-settings", logoVal, menuLogoVal
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
