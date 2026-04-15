import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "500");
  const account = searchParams.get("account");

  const user = session as any;
  const isUser = user?.roles?.includes("user") && !user?.roles?.includes("admin");

  const where = isUser && user.username
    ? { customerAccount: user.username }
    : account
    ? { customerAccount: { contains: account } }
    : undefined;

  try {
    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { dateCreated: "desc" },
      take: limit,
    });
    return NextResponse.json(invoices);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
