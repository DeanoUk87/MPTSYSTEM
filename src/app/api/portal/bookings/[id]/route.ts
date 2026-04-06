import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session as any;
  if (!user.customerId) return NextResponse.json({ error: "Not a customer account" }, { status: 403 });

  const { id } = await params;
  const booking = await prisma.booking.findFirst({
    where: { id, customerId: user.customerId },
    include: {
      vehicle: { select: { name: true } },
      driver: { select: { name: true, phone: true } },
      viaAddresses: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      geoTracking: true,
    },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(booking);
}
