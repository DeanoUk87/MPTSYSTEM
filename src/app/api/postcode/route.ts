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
    // postcodes.io gives us the admin_ward (local area name) which is more specific than admin_district
    const town = r.admin_ward || r.admin_district || r.parliamentary_constituency || "";
    return [{
      line1: "",
      line2: "",
      line3: "",
      city: town,
      county: r.admin_county || r.admin_district || "",
      postcode: r.postcode,
      label: `${town}${r.admin_district && r.admin_district !== town ? `, ${r.admin_district}` : ""}`,
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
  if (!postcode) return NextResponse.json({ error: "postcode required" }, { status: 400 });

  const apiKey = process.env.CRAFTY_CLICKS_API_KEY;
  if (!apiKey) {
    const fallback = await fallbackLookup(postcode);
    return NextResponse.json({ results: fallback });
  }

  try {
    const url = `https://api.craftyclicks.co.uk/address/1.1/find?postcode=${encodeURIComponent(postcode)}&key=${apiKey}&response=data_formatted`;
    const res = await fetch(url);
    if (!res.ok) {
      const fallback = await fallbackLookup(postcode);
      return NextResponse.json({ results: fallback });
    }

    const data = await res.json();

    // Handle error response from Crafty Clicks
    if (data.error_code || data.error) {
      const fallback = await fallbackLookup(postcode);
      return NextResponse.json({ results: fallback });
    }

    // Support both `results` array and `addresses` array (different API versions)
    const raw: any[] = data.results ?? data.addresses ?? [];
    if (raw.length === 0) {
      const fallback = await fallbackLookup(postcode);
      return NextResponse.json({ results: fallback });
    }

    // Return normalised address list
    const results = raw.map((r: any) => ({
      line1: r.line_1 ?? r.address_line_1 ?? "",
      line2: r.line_2 ?? r.address_line_2 ?? "",
      line3: r.line_3 ?? r.address_line_3 ?? "",
      city: r.locality ?? r.town_or_city ?? r.post_town ?? "",
      county: r.county ?? "",
      postcode: postcode.toUpperCase(),
      label: r.place_name ?? `${r.line_1 ?? r.address_line_1}, ${r.town_or_city ?? r.post_town ?? ""}`,
    }));

    return NextResponse.json({ results });
  } catch {
    const fallback = await fallbackLookup(postcode);
    return NextResponse.json({ results: fallback });
  }
}
