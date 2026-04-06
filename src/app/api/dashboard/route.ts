import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    totalCustomers,
    totalSales,
    totalInvoices,
    pendingInvoices,
    sentInvoices,
    unsent,
    archivedSales,
    recentInvoices,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.sale.count(),
    prisma.invoice.count(),
    prisma.invoice.count({ where: { printer: 0 } }),
    prisma.invoice.count({ where: { emailStatus: 1 } }),
    prisma.invoice.count({ where: { emailStatus: 0 } }),
    prisma.saleArchive.count(),
    prisma.invoice.findMany({
      take: 10,
      orderBy: { dateCreated: "desc" },
      select: {
        id: true,
        invoiceNumber: true,
        customerAccount: true,
        invoiceDate: true,
        emailStatus: true,
        printer: true,
      },
    }),
  ]);

  return NextResponse.json({
    stats: { totalCustomers, totalSales, totalInvoices, pendingInvoices, sentInvoices, unsent, archivedSales },
    recentInvoices,
  });
}
