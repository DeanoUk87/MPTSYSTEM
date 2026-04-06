import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "500");
  const account = searchParams.get("account");

  const user = session.user as any;
  const isUser = user?.roles?.includes("user") && !user?.roles?.includes("admin");

  const where = isUser && user.username
    ? { customerAccount: user.username }
    : account
    ? { customerAccount: { contains: account } }
    : undefined;

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { dateCreated: "desc" },
    take: limit,
  });
  return NextResponse.json(invoices);
}
