import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (from) where.invoiceDate = { gte: from };
  if (to) where.invoiceDate = { ...where.invoiceDate, lte: to };

  const sales = await prisma.sale.findMany({ where, orderBy: { invoiceDate: "asc" } });

  // Group by invoice number and sum
  const grouped = new Map<string, { customerAccount2: string; invoiceDate: string; jobNumber: string; invoiceTotal: number; vatAmount: number }>();
  for (const s of sales) {
    const key = s.invoiceNumber;
    const total = parseFloat(s.invoiceTotal ?? "0") || 0;
    const vat = parseFloat(s.vatAmount ?? "0") || 0;
    if (grouped.has(key)) {
      const g = grouped.get(key)!;
      g.invoiceTotal += total;
      g.vatAmount += vat;
    } else {
      grouped.set(key, {
        customerAccount2: s.customerAccount2 ?? "",
        invoiceDate: s.invoiceDate,
        jobNumber: s.jobNumber ?? "",
        invoiceTotal: total,
        vatAmount: vat,
      });
    }
  }

  const rows = Array.from(grouped.entries()).map(([invNo, g]) => {
    const net = Math.round((g.invoiceTotal - g.vatAmount) * 100) / 100;
    return [g.customerAccount2, g.invoiceDate, invNo, g.jobNumber, net, g.invoiceTotal].join(",");
  });

  const csv = ["account2,invoice_date,invoice_number,job_number,net_total,invoice_total", ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="sage-export-${Date.now()}.csv"`,
    },
  });
}
