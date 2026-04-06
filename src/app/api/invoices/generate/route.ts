import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get settings for due date calculation
  const settings = await prisma.settings.findFirst();
  const dueDays = settings?.invoiceDueDate ?? 30;

  // Find all ungrouped sales (not yet turned into invoices)
  const unprocessedSales = await prisma.sale.findMany({
    where: { invoiceReady: 0 },
  });

  if (!unprocessedSales.length) {
    return NextResponse.json({ generated: 0, message: "No pending sales to invoice." });
  }

  // Group by invoiceNumber
  const groups = new Map<string, typeof unprocessedSales>();
  for (const s of unprocessedSales) {
    if (!groups.has(s.invoiceNumber)) groups.set(s.invoiceNumber, []);
    groups.get(s.invoiceNumber)!.push(s);
  }

  let generated = 0;

  for (const [invoiceNumber, sales] of groups.entries()) {
    const first = sales[0];
    const customerAccount = first.customerAccount;
    const invoiceDate = first.invoiceDate;
    const poNumber = first.numb2 ?? null;

    // Calculate due date
    let dueDate = invoiceDate;
    try {
      const d = new Date(invoiceDate);
      d.setDate(d.getDate() + dueDays);
      dueDate = d.toISOString().split("T")[0];
    } catch {}

    const customer = await prisma.customer.findUnique({ where: { customerAccount } });
    const terms = customer?.termsOfPayment ?? `${dueDays} days`;

    // Check if already exists
    const existing = await prisma.invoice.findFirst({ where: { invoiceNumber } });

    if (!existing) {
      await prisma.invoice.create({
        data: {
          customerAccount,
          invoiceNumber,
          invoiceDate,
          dueDate,
          terms,
          poNumber,
          printer: 0,
          emailStatus: 0,
        },
      });
      generated++;
    }

    // Mark sales as invoiceReady
    await prisma.sale.updateMany({
      where: { invoiceNumber },
      data: { invoiceReady: 1 },
    });
  }

  return NextResponse.json({ generated, total: groups.size });
}
