import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const driverId = searchParams.get("driverId");
  const status = searchParams.get("status");
  const date = searchParams.get("date");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  // podOnly=1 → only jobs with podDate+podTime+signature (completed) — for reports
  const podOnly = searchParams.get("podOnly") === "1";

  const where: any = { deletedAt: null };
  if (customerId) where.customerId = customerId;
  // driverId filter: match main driver OR second man OR CX driver
  if (driverId) {
    where.OR = [
      { driverId },
      { secondManId: driverId },
      { cxDriverId: driverId },
    ];
  }
  if (status !== null && status !== "") where.jobStatus = parseInt(status);
  if (date) where.collectionDate = date;
  if (dateFrom || dateTo) {
    where.collectionDate = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }
  if (podOnly) {
    where.podDate = { not: null };
    where.podTime = { not: null };
    where.AND = [
      { OR: [{ podSignature: { not: null } }, { podUpload: { not: null } }] },
    ];
  }

  // Customer role scoping
  const user = session as any;
  if (user.roles?.includes("customer") && user.customerId) {
    where.customerId = user.customerId;
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, accountNumber: true } },
      vehicle: { select: { id: true, name: true } },
      driver: { select: { id: true, name: true, driverType: true } },
      secondMan: { select: { id: true, name: true } },
      cxDriver: { select: { id: true, name: true } },
      bookingType: { select: { id: true, name: true } },
      viaAddresses: { where: { deletedAt: null }, orderBy: { createdAt: "asc" }, take: 6, select: { id: true, postcode: true, viaType: true, name: true, address1: true, city: true, signedBy: true } },
    },
    orderBy: { collectionDate: "asc" },
    take: 1000,
  });

  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    // Destructure out form-only fields that are not in the Booking schema
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { chillUnitId, ambientUnitId, driverId, secondManContactId: _smc, cxDriverContactId: _cxc, viaAddresses: viaData, ...rest } = body;

    const booking = await prisma.booking.create({
      data: {
        ...rest,
        driverId: driverId || null,
        chillUnitId: chillUnitId || null,
        ambientUnitId: ambientUnitId || null,
        createdById: (session as any).id,
      },
    });

    // Generate jobRef based on customer account number + per-customer increment
    if (rest.customerId) {
      try {
        const cust = await prisma.customer.findUnique({
          where: { id: rest.customerId },
          select: { accountNumber: true, jobRefStart: true, _count: { select: { bookings: true } } },
        });
        if (cust) {
          const base = (cust.jobRefStart ?? 1) + ((cust._count?.bookings ?? 1) - 1);
          const jobRef = `${cust.accountNumber ?? "JOB"}-${String(base).padStart(5, "0")}`;
          await prisma.booking.update({ where: { id: booking.id }, data: { jobRef } });
          (booking as any).jobRef = jobRef;
        }
      } catch (_) { /* non-critical */ }
    }

    // Allocate storage units — trackable only when a driver is also assigned
    for (const unitId of [chillUnitId, ambientUnitId].filter(Boolean)) {
      if (driverId) {
        // Driver + unit assigned: mark in-use and enable tracking
        await prisma.storageUnit.update({
          where: { id: unitId },
          data: { availability: "No", currentDriverId: driverId, jobId: booking.id, trackable: 1 },
        }).catch(() => {});
      } else {
        // Unit assigned to job but no driver yet — unavailable but NOT trackable
        await prisma.storageUnit.update({
          where: { id: unitId },
          data: { availability: "No", jobId: booking.id, trackable: 0 },
        }).catch(() => {});
      }
      if (unitId) {
        await prisma.storageUsage.create({
          data: { unitId, jobId: booking.id, driverId: driverId || null },
        });
      }
    }

    // Create via / collected-order addresses
    if (Array.isArray(viaData)) {
      for (const via of viaData) {
        if (!via.name && !via.postcode) continue;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, bookingId: _bid, createdAt: _ca, updatedAt: _ua, deletedAt: _da, ...viaFields } = via;
        await prisma.viaAddress.create({ data: { ...viaFields, bookingId: booking.id } });
      }
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (e: any) {
    console.error("Booking create error:", e);
    return NextResponse.json({ error: e.message || "Failed to create booking" }, { status: 500 });
  }
}
