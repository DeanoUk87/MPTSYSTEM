import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { legacyQuery } from "@/lib/legacy-db";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("search") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo   = searchParams.get("dateTo") || "";
  const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit    = 50;
  const offset   = (page - 1) * limit;

  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push("(b.job_ref LIKE ? OR c.customer_name LIKE ? OR b.collection_postcode LIKE ? OR b.delivery_postcode LIKE ? OR b.purchase_order LIKE ?)");
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
    }
    if (dateFrom) { conditions.push("b.collection_date >= ?"); params.push(dateFrom); }
    if (dateTo)   { conditions.push("b.collection_date <= ?"); params.push(dateTo); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRows = await legacyQuery<{ total: number }>(
      `SELECT COUNT(*) as total FROM booking b
       LEFT JOIN customers c ON c.id = b.customer
       ${where}`,
      params
    );
    const total = countRows[0]?.total ?? 0;

    const rows = await legacyQuery(
      `SELECT b.job_ref, b.collection_date, b.collection_time, b.collection_name, b.collection_postcode,
              b.delivery_name, b.delivery_postcode, b.job_status,
              b.pod_signature, b.pod_date, b.purchase_order, b.customer_price,
              b.driver_cost, b.extra_cost, b.cxdriver_cost,
              c.customer_name AS customer,
              CONCAT(d.first_name, ' ', d.last_name) AS driver,
              v.vehicle_name AS vehicle
       FROM booking b
       LEFT JOIN customers c ON c.id = b.customer
       LEFT JOIN drivers d ON d.id = b.driver
       LEFT JOIN vehicles v ON v.id = b.vehicle
       ${where}
       ORDER BY b.collection_date DESC, b.job_ref DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({ bookings: rows, total, page, pages: Math.ceil(total / limit) });
  } catch (e: any) {
    console.error("Legacy bookings error:", e.message);
    return NextResponse.json({ error: e.message || "Legacy DB connection failed", detail: { host: process.env.LEGACY_DB_HOST, user: process.env.LEGACY_DB_USER, database: process.env.LEGACY_DB_NAME, hasPass: !!process.env.LEGACY_DB_PASS } }, { status: 500 });
  }
}
