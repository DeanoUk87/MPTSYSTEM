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
      conditions.push("(b.job_ref LIKE ? OR c.customer LIKE ? OR b.collection_postcode LIKE ? OR b.delivery_postcode LIKE ? OR b.purchase_order LIKE ?)");
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
    }
    if (dateFrom) { conditions.push("b.collection_date >= ?"); params.push(dateFrom); }
    if (dateTo)   { conditions.push("b.collection_date <= ?"); params.push(dateTo); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRows = await legacyQuery<{ total: number }>(
      `SELECT COUNT(*) as total FROM booking b
       LEFT JOIN customers c ON c.customer_id = b.customer
       ${where}`,
      params
    );
    const total = countRows[0]?.total ?? 0;

    const rows = await legacyQuery(
      `SELECT b.job_ref,
              DATE_FORMAT(b.collection_date, '%Y-%m-%d') AS collection_date,
              b.collection_time, b.collection_postcode,
              b.delivery_postcode, b.job_status,
              b.pod_signature, DATE_FORMAT(b.pod_date, '%Y-%m-%d') AS pod_date,
              COALESCE(b.driver_cost, 0) + COALESCE(b.extra_cost, 0) + COALESCE(b.cxdriver_cost, 0) AS driver_cost_total,
              c.customer AS customer,
              COALESCE(d.driver, d2.driver, d3.driver) AS driver,
              v.name AS vehicle
       FROM booking b
       LEFT JOIN customers c ON c.customer_id = b.customer
       LEFT JOIN drivers d ON d.driver_id = b.driver AND b.driver > 0
       LEFT JOIN drivers d2 ON d2.driver_id = b.second_man AND b.second_man > 0
       LEFT JOIN drivers d3 ON d3.driver_id = b.cxdriver AND b.cxdriver > 0
       LEFT JOIN vehicles v ON v.id = b.vehicle
       ${where}
       ORDER BY b.collection_date DESC, b.job_ref DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    // Fetch via addresses for this page of results
    const jobRefs = rows.map((r: any) => r.job_ref).filter(Boolean);
    let viaMap: Record<string, string[]> = {};
    if (jobRefs.length > 0) {
      const placeholders = jobRefs.map(() => "?").join(",");
      const vias = await legacyQuery<{ job_ref: string; postcode: string }>(
        `SELECT job_ref, postcode FROM via_address WHERE job_ref IN (${placeholders}) AND deleted_at IS NULL ORDER BY via_id ASC`,
        jobRefs
      );
      for (const v of vias) {
        if (!viaMap[v.job_ref]) viaMap[v.job_ref] = [];
        if (viaMap[v.job_ref].length < 6) viaMap[v.job_ref].push(v.postcode || "");
      }
    }

    const bookings = rows.map((r: any) => ({
      ...r,
      vias: viaMap[r.job_ref] || [],
    }));

    return NextResponse.json({ bookings, total, page, pages: Math.ceil(total / limit) });
  } catch (e: any) {
    console.error("Legacy bookings error:", e.message);
    return NextResponse.json({ error: e.message || "Legacy DB connection failed", detail: { host: process.env.LEGACY_DB_HOST, user: process.env.LEGACY_DB_USER, database: process.env.LEGACY_DB_NAME, hasPass: !!process.env.LEGACY_DB_PASS } }, { status: 500 });
  }
}
