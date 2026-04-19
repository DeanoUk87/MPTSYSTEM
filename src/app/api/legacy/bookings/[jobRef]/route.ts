import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { legacyQuery } from "@/lib/legacy-db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobRef: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobRef } = await params;

  try {
    const bookings = await legacyQuery(
      `SELECT * FROM booking WHERE job_ref = ? AND deleted_at IS NULL LIMIT 1`,
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
