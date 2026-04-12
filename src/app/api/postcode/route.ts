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
  if (!postcode) return NextResponse.json({ error: "postcode required" }, { status: 400 });

  // Use env key or fall back to hardcoded key
  const apiKey = process.env.CRAFTY_CLICKS_API_KEY || "b6156-93a8a-c5122-0314a";

  try {
    const url = `https://api.craftyclicks.co.uk/address/1.1/find?postcode=${encodeURIComponent(postcode)}&key=${apiKey}&response=data_formatted`;
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

    // Support both `result` array (Crafty Clicks v1.1) and `results`/`addresses` arrays
    const raw: any[] = data.result ?? data.results ?? data.addresses ?? [];
    if (raw.length === 0) {
      const fallback = await fallbackLookup(postcode);
      return NextResponse.json({ results: fallback });
    }

    // Return normalised address list
    const results = raw.map((r: any) => ({
      line1: r.line_1 ?? r.address_line_1 ?? "",
      line2: r.line_2 ?? r.address_line_2 ?? "",
      line3: r.line_3 ?? r.address_line_3 ?? "",
      city: r.town ?? r.locality ?? r.town_or_city ?? r.post_town ?? "",
      county: r.county ?? "",
      postcode: postcode.toUpperCase(),
      label: r.line_1 ? `${r.line_1}, ${r.town ?? r.locality ?? r.town_or_city ?? ""}` : (r.place_name ?? ""),
    }));

    return NextResponse.json({ results });
  } catch (e: any) {
    if (debug) return NextResponse.json({ debug: true, error: e.message });
    const fallback = await fallbackLookup(postcode);
    return NextResponse.json({ results: fallback });
  }
}
