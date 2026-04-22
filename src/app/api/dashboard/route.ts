import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  // Dashboard is accessible to all authenticated users
  await requireAuth(req); // allow even if null — stats are not sensitive

  const date = req.nextUrl.searchParams.get("date") || null;
  const kpi = req.nextUrl.searchParams.get("kpi") === "1";

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
        where: { deletedAt: null, ...(date ? { collectionDate: date } : {}) },
        orderBy: { collectionTime: "asc" },
        select: {
          id: true,
          jobRef: true,
          collectionDate: true,
          collectionTime: true,
          collectionPostcode: true,
          deliveryPostcode: true,
          customerPrice: true,
          manualAmount: true,
          driverCost: true,
          extraCost: true,
          cxDriverCost: true,
          jobStatus: true,
          podSignature: true,
          podDataVerify: true,
          customer: { select: { name: true } },
          driver: { select: { name: true } },
          cxDriver: { select: { name: true } },
          secondMan: { select: { name: true } },
          driverContact: { select: { driverName: true } },
          vehicle: { select: { name: true } },
          bookingType: { select: { name: true } },
          viaAddresses: { where: { deletedAt: null }, orderBy: { createdAt: "asc" }, take: 6, select: { id: true, postcode: true, viaType: true, signedBy: true } },
        },
      }),
    ]);

    let kpiData = null;
    if (kpi) {
      // Last 8 weeks of jobs + revenue
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
      const eightWeeksAgoStr = eightWeeksAgo.toISOString().slice(0, 10);

      const [kpiBookings, topCustomers, thisMonthBookings, lastMonthBookings] = await Promise.all([
        prisma.booking.findMany({
          where: { deletedAt: null, collectionDate: { gte: eightWeeksAgoStr } },
          select: { collectionDate: true, customerPrice: true, manualAmount: true, driverCost: true, extraCost: true, cxDriverCost: true },
        }),
        prisma.booking.groupBy({
          by: ["customerId"],
          where: { deletedAt: null },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 5,
        }),
        prisma.booking.count({
          where: { deletedAt: null, collectionDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10) } },
        }),
        prisma.booking.count({
          where: { deletedAt: null, collectionDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 10), lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10) } },
        }),
      ]);

      // Group by ISO week (Mon–Sun)
      const weekMap: Record<string, { jobs: number; revenue: number; cost: number }> = {};
      for (const b of kpiBookings) {
        if (!b.collectionDate) continue;
        const d = new Date(b.collectionDate + "T00:00:00");
        const monday = new Date(d);
        monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        const weekKey = monday.toISOString().slice(0, 10);
        if (!weekMap[weekKey]) weekMap[weekKey] = { jobs: 0, revenue: 0, cost: 0 };
        weekMap[weekKey].jobs++;
        weekMap[weekKey].revenue += b.manualAmount ?? b.customerPrice ?? 0;
        weekMap[weekKey].cost += (b.driverCost ?? 0) + (b.extraCost ?? 0) + (b.cxDriverCost ?? 0);
      }
      const weeklyData = Object.entries(weekMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, v]) => ({ week, ...v }));

      // Resolve customer names
      const customerIds = topCustomers.map((c: any) => c.customerId).filter(Boolean);
      const customerRecords = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true },
      });
      const customerMap = Object.fromEntries(customerRecords.map((c: any) => [c.id, c.name]));
      const topCustomersNamed = topCustomers.map((c: any) => ({
        name: customerMap[c.customerId] ?? "Unknown",
        jobs: c._count.id,
      }));

      kpiData = { weeklyData, topCustomers: topCustomersNamed, thisMonthBookings, lastMonthBookings };
    }

    return NextResponse.json({
      stats: { totalCustomers, totalSales, totalVehicles, totalDrivers },
      recentBookings,
      kpi: kpiData,
    });
  } catch (e: any) {
    console.error("Dashboard GET error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
