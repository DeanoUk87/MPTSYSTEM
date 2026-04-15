import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const settings = await prisma.settings.findFirst();
    if (!settings) return NextResponse.json({});
    const { logo: _l, menuLogo: _m, ...rest } = settings as any;
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
    // Strip fields not in generated Prisma client
    const { logo: _l, menuLogo: _m, bookingRefreshInterval, id: _id, vatPercent: _vp, ...data } = body;
    const f = data as any;

    const existing = await prisma.settings.findFirst();
    if (existing) {
      await prisma.settings.update({
        where: { id: existing.id },
        data: {
          companyName: f.companyName || "",
          companyAddress1: f.companyAddress1 || null,
          companyAddress2: f.companyAddress2 || null,
          state: f.state || null,
          city: f.city || null,
          postcode: f.postcode || null,
          country: f.country || null,
          phone: f.phone || null,
          fax: f.fax || null,
          cemail: f.cemail || null,
          website: f.website || null,
          primaryContact: f.primaryContact || null,
          baseCurrency: f.baseCurrency || "GBP",
          vatNumber: f.vatNumber || null,
          invoiceDueDate: parseInt(f.invoiceDueDate) || 30,
          invoiceDuePaymentBy: f.invoiceDuePaymentBy || null,
          sendLimit: parseInt(f.sendLimit) || 50,
          messageTitle: f.messageTitle || null,
          defaultMessage: f.defaultMessage || null,
          defaultMessage2: f.defaultMessage2 || null,
        },
      });
      await prisma.settings.update({
        where: { id: existing.id },
        data: { bookingRefreshInterval: parseInt(bookingRefreshInterval) || 80 } as any,
      });
    } else {
      const created = await prisma.settings.create({
        data: {
          id: "default-settings",
          companyName: f.companyName || "",
          companyAddress1: f.companyAddress1 || null,
          companyAddress2: f.companyAddress2 || null,
          state: f.state || null,
          city: f.city || null,
          postcode: f.postcode || null,
          country: f.country || null,
          phone: f.phone || null,
          fax: f.fax || null,
          cemail: f.cemail || null,
          website: f.website || null,
          primaryContact: f.primaryContact || null,
          baseCurrency: f.baseCurrency || "GBP",
          vatNumber: f.vatNumber || null,
          invoiceDueDate: parseInt(f.invoiceDueDate) || 30,
          invoiceDuePaymentBy: f.invoiceDuePaymentBy || null,
          sendLimit: parseInt(f.sendLimit) || 50,
          messageTitle: f.messageTitle || null,
          defaultMessage: f.defaultMessage || null,
          defaultMessage2: f.defaultMessage2 || null,
        },
      });
      await prisma.settings.update({
        where: { id: created.id },
        data: { bookingRefreshInterval: parseInt(bookingRefreshInterval) || 80 } as any,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Settings PUT error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
