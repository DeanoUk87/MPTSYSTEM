import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase() ?? "";

  // Pull distinct collection and delivery addresses from bookings
  const bookings = await prisma.booking.findMany({
    select: {
      id: true,
      collectionName: true, collectionAddress1: true, collectionAddress2: true,
      collectionArea: true, collectionPostcode: true, collectionCountry: true,
      collectionContact: true, collectionPhone: true,
      deliveryName: true, deliveryAddress1: true, deliveryAddress2: true,
      deliveryArea: true, deliveryPostcode: true, deliveryCountry: true,
      deliveryContact: true, deliveryPhone: true,
    },
  });

  // Build unique address map keyed by name+postcode
  const map = new Map<string, any>();
  for (const b of bookings) {
    for (const prefix of ["collection", "delivery"] as const) {
      const name = b[`${prefix}Name`];
      const postcode = b[`${prefix}Postcode`];
      if (!name && !postcode) continue;
      const key = `${(name ?? "").toLowerCase()}||${(postcode ?? "").toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, {
          name: name ?? "",
          address1: b[`${prefix}Address1`] ?? "",
          address2: b[`${prefix}Address2`] ?? "",
          area: b[`${prefix}Area`] ?? "",
          postcode: postcode ?? "",
          country: b[`${prefix}Country`] ?? "",
          contact: b[`${prefix}Contact`] ?? "",
          phone: b[`${prefix}Phone`] ?? "",
          bookingId: b.id,
          type: prefix,
        });
      }
    }
  }

  let results = Array.from(map.values());

  if (search) {
    results = results.filter(a =>
      a.name.toLowerCase().includes(search) ||
      a.postcode.toLowerCase().includes(search) ||
      a.address1.toLowerCase().includes(search) ||
      a.area.toLowerCase().includes(search)
    );
  }

  results.sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json(results);
}
