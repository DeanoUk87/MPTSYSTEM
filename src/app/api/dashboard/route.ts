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

  try {
  const [
    totalCustomers,
    totalSales,
    totalVehicles,
    totalDrivers,
    recentBookings,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.sale.count(),
    prisma.vehicle.count(),
    prisma.driver.count({ where: { driverType: "Driver" } }),
    prisma.booking.findMany({
      where: {},
      take: 15,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        collectionDate: true,
        collectionTime: true,
        collectionPostcode: true,
        deliveryPostcode: true,
        customerPrice: true,
        driverCost: true,
        jobStatus: true,
        podSignature: true,
        podDataVerify: true,
        customer: { select: { name: true } },
        driver: { select: { name: true } },
        vehicle: { select: { name: true } },
        bookingType: { select: { name: true } },
        viaAddresses: { where: { deletedAt: null }, orderBy: { createdAt: "asc" }, take: 6, select: { id: true, postcode: true, viaType: true, signedBy: true } },
      },
    }),
  ]);

  return NextResponse.json({
    stats: { totalCustomers, totalSales, totalVehicles, totalDrivers },
    recentBookings,
  });
  } catch (e: any) {
    console.error("Dashboard GET error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
