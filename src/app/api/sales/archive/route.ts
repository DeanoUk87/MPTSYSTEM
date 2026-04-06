import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { from, to } = await req.json();
  if (!from || !to) return NextResponse.json({ error: "from and to dates required" }, { status: 400 });

  // Max 14 day range safety guard
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 14) return NextResponse.json({ error: "Date range cannot exceed 14 days" }, { status: 400 });

  // Get sales to archive
  const salesToArchive = await prisma.sale.findMany({
    where: { invoiceDate: { gte: from, lte: to } },
  });
  const invoiceNumbers = [...new Set(salesToArchive.map((s) => s.invoiceNumber))];
  const invoicesToArchive = await prisma.invoice.findMany({
    where: { invoiceNumber: { in: invoiceNumbers } },
  });

  let archivedSales = 0;
  let archivedInvoices = 0;

  // Archive sales
  for (const s of salesToArchive) {
    await prisma.saleArchive.create({
      data: {
        invoiceNumber: s.invoiceNumber,
        invoiceDate: s.invoiceDate,
        customerAccount: s.customerAccount,
        customerName: s.customerName,
        address1: s.address1, address2: s.address2, town: s.town,
        country: s.country, postcode: s.postcode,
        customerAccount2: s.customerAccount2,
        items: s.items, weight: s.weight, invoiceTotal: s.invoiceTotal,
        jobNumber: s.jobNumber, jobDate: s.jobDate,
        sendingDepot: s.sendingDepot, deliveryDepot: s.deliveryDepot,
        destination: s.destination, town2: s.town2, postcode2: s.postcode2,
        serviceType: s.serviceType, items2: s.items2, volumeWeight: s.volumeWeight,
        increasedLiabilityCover: s.increasedLiabilityCover, subTotal: s.subTotal,
        senderReference: s.senderReference, sendersPostcode: s.sendersPostcode,
        vatAmount: s.vatAmount, vatPercent: s.vatPercent,
        percentageFuelSurcharge: s.percentageFuelSurcharge,
        percentageResourcingSurcharge: s.percentageResourcingSurcharge,
        uploadCode: s.uploadCode, uploadTs: s.uploadTs,
        msCreated: s.msCreated, invoiceReady: s.invoiceReady,
        numb1: s.numb1, numb2: s.numb2, numb3: s.numb3, numb4: s.numb4, numb5: s.numb5,
      },
    });
    archivedSales++;
  }

  // Archive invoices
  for (const inv of invoicesToArchive) {
    await prisma.invoiceArchive.create({
      data: {
        originalId: inv.id,
        customerAccount: inv.customerAccount,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        terms: inv.terms,
        printer: inv.printer,
        poNumber: inv.poNumber,
        emailStatus: inv.emailStatus,
      },
    });
    archivedInvoices++;
  }

  // Delete originals
  await prisma.invoice.deleteMany({ where: { invoiceNumber: { in: invoiceNumbers } } });
  await prisma.sale.deleteMany({ where: { id: { in: salesToArchive.map((s) => s.id) } } });

  return NextResponse.json({ archivedSales, archivedInvoices });
}
