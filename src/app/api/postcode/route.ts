import { NextRequest, NextResponse } from "next/server";

// postcodes.io fallback — returns town info when Crafty Clicks has no results
async function fallbackLookup(postcode: string): Promise<any[]> {
  try {
    const clean = postcode.replace(/\s+/g, "").toUpperCase();
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.result) return [];
    const r = data.result;
    const town = r.admin_ward || r.admin_district || r.parliamentary_constituency || "";
    const district = r.admin_district || "";
    return [{
      line1: "",
      line2: "",
      line3: "",
      city: town,
      county: r.admin_county || district || "",
      postcode: r.postcode,
      label: `${town}${district && district !== town ? `, ${district}` : ""}`,
      fallback: true,
    }];
  } catch {
    return [];
  }
}

// Crafty Clicks postcode lookup — returns address fields for a given postcode
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postcode = searchParams.get("postcode");
  const debug = searchParams.get("debug") === "1";

  // Auth check — postcode lookup uses a paid API key
  const { requireAuth } = await import("@/lib/api-auth");
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!postcode) return NextResponse.json({ error: "postcode required" }, { status: 400 });

  // Use env key or fall back to hardcoded key
  const apiKey = process.env.CRAFTY_CLICKS_API_KEY || "b6156-93a8a-c5122-0314a";

  try {
    // Crafty Clicks v1.1 requires `query` + `country` parameters (not `postcode`)
    const clean = postcode.replace(/\s+/g, "").toUpperCase();
    const url = `https://api.craftyclicks.co.uk/address/1.1/find?query=${encodeURIComponent(clean)}&country=GB&key=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      if (debug) return NextResponse.json({ debug: true, httpStatus: res.status, httpStatusText: res.statusText });
      const fallback = await fallbackLookup(postcode);
      return NextResponse.json({ results: fallback });
    }

    const data = await res.json();

    // Debug mode — return raw Crafty Clicks response
    if (debug) return NextResponse.json({ debug: true, apiKey: apiKey.slice(0, 8) + "...", raw: data });

    // Handle error response from Crafty Clicks
    if (data.error_code || data.error) {
      const fallback = await fallbackLookup(postcode);
      return NextResponse.json({ results: fallback, _cc_error: data.error_code ?? data.error });
    }

    // Crafty Clicks find returns: { results: [{ id, count, labels: [postcode, "line1, line2, city"] }] }
    const raw: any[] = data.results ?? [];
    if (raw.length === 0) {
      const fallback = await fallbackLookup(postcode);
      return NextResponse.json({ results: fallback });
    }

    // Parse each result's label into structured address fields
    const results = raw.map((r: any) => {
      const addressStr: string = r.labels?.[1] ?? "";
      const parts = addressStr.split(", ").map((p: string) => p.trim()).filter(Boolean);
      const line1 = parts[0] ?? "";
      const city = parts.length > 1 ? parts[parts.length - 1] : "";
      const line2 = parts.length > 2 ? parts.slice(1, -1).join(", ") : (parts.length === 2 ? "" : "");
      return {
        line1,
        line2,
        line3: "",
        city,
        county: "",
        postcode: (r.labels?.[0] ?? postcode).toUpperCase(),
        label: addressStr,
      };
    });

    return NextResponse.json({ results });
  } catch (e: any) {
    if (debug) return NextResponse.json({ debug: true, error: e.message });
    const fallback = await fallbackLookup(postcode);
    return NextResponse.json({ results: fallback });
  }
}
