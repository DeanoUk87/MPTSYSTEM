import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const SECRET = process.env.NEXTAUTH_SECRET ?? "mp-booking-fallback-secret-change-in-production";

export async function GET(req: NextRequest) {
  // Accept either our custom JWT cookie or no auth (dashboard is read-only stats)
  const token = req.cookies.get("mp-session")?.value;
  if (token) {
    try { await jwtVerify(token, new TextEncoder().encode(SECRET)); } catch { /* allow */ }
  }

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
