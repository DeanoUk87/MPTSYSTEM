import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

const SECRET = process.env.NEXTAUTH_SECRET;

function getSecret(): Uint8Array {
  if (!SECRET) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(SECRET);
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  // Rate limiting
  const rateResult = checkRateLimit(ip);
  if (!rateResult.allowed) {
    const retryAfterSec = Math.ceil(rateResult.retryAfterMs / 1000);
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const login = typeof body?.login === "string" ? body.login.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!login || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: login }, { username: login }],
        userStatus: 1,
      },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });

    const valid = user?.password ? await bcrypt.compare(password, user.password) : false;

    if (!user || !valid) {
      // Log failed attempt
      await prisma.auditLog.create({
        data: {
          action: "LOGIN_FAIL",
          userId: user?.id ?? null,
          ipAddress: ip,
          userAgent,
          detail: `Failed login attempt for: ${login}`,
        },
      }).catch(() => {});
      return NextResponse.json({ error: "Invalid email/username or password" }, { status: 401 });
    }

    // Successful login — reset rate limit and log
    resetRateLimit(ip);

    await prisma.auditLog.create({
      data: {
        action: "LOGIN_SUCCESS",
        userId: user.id,
        ipAddress: ip,
        userAgent,
        detail: `User logged in: ${user.email}`,
      },
    }).catch(() => {});

    const roles = user.roles.map((ur: any) => ur.role.name);
    const permissions = user.roles.flatMap((ur: any) =>
      ur.role.permissions.map((rp: any) => rp.permission.name)
    );

    // Sign JWT — short-lived (8 hours)
    const token = await new SignJWT({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      customerId: user.customerId ?? null,
      driverId: user.driverId ?? null,
      dcontactId: user.dcontactId ?? null,
      roles,
      permissions,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(getSecret());

    const redirectTo = user.customerId
      ? "/portal"
      : user.driverId
      ? "/driver-portal"
      : user.dcontactId
      ? "/driver"
      : "/admin";

    const res = NextResponse.json({ ok: true, redirectTo });
    res.cookies.set("mp-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
