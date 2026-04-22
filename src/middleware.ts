import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow all public paths through without auth
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Verify session cookie
  const token = req.cookies.get("mp-session")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    // Customers must only access /portal, not /admin
    if (pathname.startsWith("/admin") && (payload as any).customerId) {
      const url = req.nextUrl.clone();
      url.pathname = "/portal";
      return NextResponse.redirect(url);
    }
    // Main drivers must only access /driver-portal, not /admin
    if (pathname.startsWith("/admin") && (payload as any).driverId) {
      const url = req.nextUrl.clone();
      url.pathname = "/driver-portal";
      return NextResponse.redirect(url);
    }
    // Driver contacts must only access /driver, not /admin
    if (pathname.startsWith("/admin") && (payload as any).dcontactId) {
      const url = req.nextUrl.clone();
      url.pathname = "/driver";
      return NextResponse.redirect(url);
    }
    // Driver contacts must not access /driver-portal
    if (pathname.startsWith("/driver-portal") && !(payload as any).driverId) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    // Main drivers must not access /driver (mobile contact page)
    if (pathname.startsWith("/driver") && !pathname.startsWith("/driver-portal") && !(payload as any).dcontactId) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
