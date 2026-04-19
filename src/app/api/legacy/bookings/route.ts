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
    const conditions: string[] = ["b.deleted_at IS NULL"];
    const params: any[] = [];

    if (search) {
      conditions.push("(b.job_ref LIKE ? OR b.customer LIKE ? OR b.collection_postcode LIKE ? OR b.delivery_postcode LIKE ? OR b.purchase_order LIKE ?)");
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
    }
    if (dateFrom) { conditions.push("b.collection_date >= ?"); params.push(dateFrom); }
    if (dateTo)   { conditions.push("b.collection_date <= ?"); params.push(dateTo); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRows = await legacyQuery<{ total: number }>(
      `SELECT COUNT(*) as total FROM booking b ${where}`,
      params
    );
    const total = countRows[0]?.total ?? 0;

    const rows = await legacyQuery(
      `SELECT b.job_ref, b.customer, b.collection_date, b.collection_name, b.collection_postcode,
              b.delivery_name, b.delivery_postcode, b.driver, b.vehicle, b.job_status,
              b.pod_signature, b.pod_date, b.purchase_order, b.customer_price
       FROM booking b
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
