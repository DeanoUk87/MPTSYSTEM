import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "sales";

  try {
    if (type === "invoices") {
      const data = await prisma.invoiceArchive.findMany({ orderBy: { archivedAt: "desc" } });
      return NextResponse.json(data);
    }
    const data = await prisma.saleArchive.findMany({
      orderBy: { archivedAt: "desc" },
      take: 500,
    });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
