import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    // Raw SQL to get all columns including ones added after last prisma generate
    const rows = await prisma.$queryRaw<any[]>`SELECT * FROM "settings" LIMIT 1`;
    if (!rows.length) return NextResponse.json({});
    const { logo: _l, menuLogo: _m, ...rest } = rows[0];
    return NextResponse.json(rest);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    // Strip undefined values so Prisma doesn't reject unknown fields
    // Use raw SQL to bypass stale Prisma generated client (bookingRefreshInterval added via migration)
    const { logo: _l, menuLogo: _m, ...fields } = body;
    const f = fields as any;
    const rows = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "settings" LIMIT 1`;
    if (rows.length) {
      const sid = rows[0].id;
      await prisma.$executeRawUnsafe(
        `UPDATE "settings" SET
          "companyName" = ?, "companyAddress1" = ?, "companyAddress2" = ?,
          "state" = ?, "city" = ?, "postcode" = ?, "country" = ?,
          "phone" = ?, "fax" = ?, "cemail" = ?, "website" = ?,
          "primaryContact" = ?, "baseCurrency" = ?, "vatNumber" = ?,
          "invoiceDueDate" = ?, "invoiceDuePaymentBy" = ?, "sendLimit" = ?,
          "bookingRefreshInterval" = ?,
          "messageTitle" = ?, "defaultMessage" = ?, "defaultMessage2" = ?
        WHERE "id" = ?`,
        f.companyName || null, f.companyAddress1 || null, f.companyAddress2 || null,
        f.state || null, f.city || null, f.postcode || null, f.country || null,
        f.phone || null, f.fax || null, f.cemail || null, f.website || null,
        f.primaryContact || null, f.baseCurrency || "GBP", f.vatNumber || null,
        parseInt(f.invoiceDueDate) || 30, f.invoiceDuePaymentBy || null, parseInt(f.sendLimit) || 50,
        parseInt(f.bookingRefreshInterval) || 0,
        f.messageTitle || null, f.defaultMessage || null, f.defaultMessage2 || null,
        sid
      );
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "settings" (
          "id", "companyName", "companyAddress1", "companyAddress2",
          "state", "city", "postcode", "country",
          "phone", "fax", "cemail", "website",
          "primaryContact", "baseCurrency", "vatNumber",
          "invoiceDueDate", "invoiceDuePaymentBy", "sendLimit",
          "bookingRefreshInterval",
          "messageTitle", "defaultMessage", "defaultMessage2"
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        "default-settings",
        f.companyName || null, f.companyAddress1 || null, f.companyAddress2 || null,
        f.state || null, f.city || null, f.postcode || null, f.country || null,
        f.phone || null, f.fax || null, f.cemail || null, f.website || null,
        f.primaryContact || null, f.baseCurrency || "GBP", f.vatNumber || null,
        parseInt(f.invoiceDueDate) || 30, f.invoiceDuePaymentBy || null, parseInt(f.sendLimit) || 50,
        parseInt(f.bookingRefreshInterval) || 0,
        f.messageTitle || null, f.defaultMessage || null, f.defaultMessage2 || null
      );
    }
    const updated = await prisma.$queryRaw<any[]>`SELECT * FROM "settings" LIMIT 1`;
    return NextResponse.json(updated[0] ?? {});
  } catch (e: any) {
    console.error("Settings PUT error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
