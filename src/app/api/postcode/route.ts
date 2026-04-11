import { NextRequest, NextResponse } from "next/server";

// Crafty Clicks postcode lookup — returns address fields for a given postcode
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postcode = searchParams.get("postcode");
  if (!postcode) return NextResponse.json({ error: "postcode required" }, { status: 400 });

  const apiKey = process.env.CRAFTY_CLICKS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Postcode API not configured" }, { status: 500 });

  try {
    const url = `https://api.craftyclicks.co.uk/address/1.1/find?postcode=${encodeURIComponent(postcode)}&key=${apiKey}&response=data_formatted`;
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: "Lookup failed" }, { status: 502 });

    const data = await res.json();

    // Handle error response from Crafty Clicks
    if (data.error_code || data.error) {
      return NextResponse.json({ results: [] });
    }

    // Support both `results` array and `addresses` array (different API versions)
    const raw: any[] = data.results ?? data.addresses ?? [];
    if (raw.length === 0) {
      return NextResponse.json({ results: [] });
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
