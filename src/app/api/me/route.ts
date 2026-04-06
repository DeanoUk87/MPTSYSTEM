import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = process.env.NEXTAUTH_SECRET ?? "mp-booking-fallback-secret-change-in-production";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("mp-session")?.value;
  if (!token) return NextResponse.json(null);
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(SECRET));
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(null);
  }
}
