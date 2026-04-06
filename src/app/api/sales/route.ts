import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const account = searchParams.get("account");
  const limit = parseInt(searchParams.get("limit") || "500");

  const user = session.user as any;
  const isUser = user?.roles?.includes("user") && !user?.roles?.includes("admin");

  const where = isUser && user.username
    ? { customerAccount: user.username }
    : account
    ? { customerAccount: { contains: account } }
    : undefined;

  const sales = await prisma.sale.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json(sales);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const sale = await prisma.sale.create({ data: body });
  return NextResponse.json(sale, { status: 201 });
}
