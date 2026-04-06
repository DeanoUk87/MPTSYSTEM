import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = process.env.NEXTAUTH_SECRET ?? "mp-booking-fallback-secret-change-in-production";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public paths — no auth needed
  // All /api/ routes are allowed through; auth is handled inside each route handler
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Check our custom session cookie
  const token = req.cookies.get("mp-session")?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(SECRET));
    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
