import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { legacyQuery } from "@/lib/legacy-db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobRef: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobRef } = await params;

  try {
    const bookings = await legacyQuery(
      `SELECT b.id, b.job_ref, b.purchase_order, b.booked_by, b.booking_type,
              DATE_FORMAT(b.collection_date, '%Y-%m-%d') AS collection_date,
              b.collection_time,
              b.collection_name, b.collection_address1, b.collection_address2,
              b.collection_address3, b.collection_postcode, b.collection_notes,
              b.delivery_name, b.delivery_address1, b.delivery_address2,
              b.delivery_address3, b.delivery_postcode, b.delivery_notes,
              DATE_FORMAT(b.delivery_date, '%Y-%m-%d') AS delivery_date,
              b.delivery_time, b.goods_description, b.weight, b.pallets,
              b.temp_range, b.job_status, b.invoice_number,
              b.pod_signature, b.pod_upload,
              DATE_FORMAT(b.pod_date, '%Y-%m-%d') AS pod_date,
              b.driver, b.second_man, b.cxdriver, b.vehicle,
              b.special_instructions, b.price, b.driver_price,
              c.customer AS customer_name,
              d.driver AS driver_name,
              d2.driver AS second_man_name,
              d3.driver AS cxdriver_name,
              v.name AS vehicle_name
       FROM booking b
       LEFT JOIN customers c ON c.customer_id = b.customer
       LEFT JOIN drivers d ON d.driver_id = b.driver
       LEFT JOIN drivers d2 ON d2.driver_id = b.second_man
       LEFT JOIN drivers d3 ON d3.driver_id = b.cxdriver
       LEFT JOIN vehicles v ON v.id = b.vehicle
       WHERE b.job_ref = ? LIMIT 1`,
      [jobRef]
    );
    if (!bookings.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const vias = await legacyQuery(
      `SELECT * FROM via_address WHERE job_ref = ? AND deleted_at IS NULL ORDER BY via_id ASC`,
      [jobRef]
    );

    return NextResponse.json({ ...bookings[0], vias });
  } catch (e: any) {
    console.error("Legacy booking detail error:", e.message);
    return NextResponse.json({ error: "Failed to connect to legacy database." }, { status: 500 });
  }
}
