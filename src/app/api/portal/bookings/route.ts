import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session as any;
  if (!user.customerId) return NextResponse.json({ error: "Not a customer account" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const bookings = await prisma.booking.findMany({
    where: { customerId: user.customerId, collectionDate: date },
    include: {
      vehicle: { select: { name: true } },
      driver: { select: { name: true } },
      viaAddresses: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { collectionTime: "asc" },
  });
  return NextResponse.json(bookings);
}
