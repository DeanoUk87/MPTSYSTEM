import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { legacyQuery } from "@/lib/legacy-db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobRef: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobRef } = await params;

  try {
    const bookings = await legacyQuery(
      `SELECT b.*,
              c.customer_name AS customer_name,
              CONCAT(d.first_name, ' ', d.last_name) AS driver_name,
              CONCAT(d2.first_name, ' ', d2.last_name) AS second_man_name,
              v.vehicle_name AS vehicle_name
       FROM booking b
       LEFT JOIN customers c ON c.id = b.customer
       LEFT JOIN drivers d ON d.id = b.driver
       LEFT JOIN drivers d2 ON d2.id = b.second_man
       LEFT JOIN vehicles v ON v.id = b.vehicle
       WHERE b.job_ref = ? LIMIT 1`,
      [jobRef]
    );
    if (!bookings.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const vias = await legacyQuery(
      `SELECT * FROM via_address WHERE job_ref = ? ORDER BY id ASC`,
      [jobRef]
    );

    return NextResponse.json({ ...bookings[0], vias });
  } catch (e: any) {
    console.error("Legacy booking detail error:", e.message);
    return NextResponse.json({ error: "Failed to connect to legacy database." }, { status: 500 });
  }
}
