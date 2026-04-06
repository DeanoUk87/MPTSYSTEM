import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const permissions = await prisma.permission.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(permissions);
}
