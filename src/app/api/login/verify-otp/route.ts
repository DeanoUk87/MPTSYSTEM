import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { verifyTotpToken } from "@/lib/totp";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

function getSecret(): Uint8Array {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(s);
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

  // Rate-limit TOTP attempts by IP
  const rateResult = checkRateLimit(`2fa:${ip}`);
  if (!rateResult.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => null);
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!userId || !token) {
      return NextResponse.json({ error: "Missing userId or token" }, { status: 400 });
    }

    // Fetch user with TOTP secret
    const user = await prisma.user.findUnique({
      where: { id: userId, userStatus: 1 },
      include: {
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });

    if (!user || !user.totpSecret) {
      return NextResponse.json({ error: "2FA not configured for this account" }, { status: 401 });
    }

    const valid = verifyTotpToken(user.totpSecret, token);

    if (!valid) {
      await prisma.auditLog.create({
        data: { action: "LOGIN_FAIL_2FA", userId, ipAddress: ip, userAgent, detail: "Invalid TOTP token" },
      }).catch(() => {});
      return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 401 });
    }

    resetRateLimit(`2fa:${ip}`);

    await prisma.auditLog.create({
      data: { action: "LOGIN_SUCCESS", userId: user.id, ipAddress: ip, userAgent, detail: `2FA login: ${user.email}` },
    }).catch(() => {});

    const roles = user.roles.map((ur: any) => ur.role.name);
    const permissions = user.roles.flatMap((ur: any) =>
      ur.role.permissions.map((rp: any) => rp.permission.name)
    );

    const jwtToken = await new SignJWT({
      id: user.id, name: user.name, email: user.email,
      username: user.username,
      customerId: user.customerId ?? null,
      driverId: user.driverId ?? null,
      dcontactId: user.dcontactId ?? null,
      roles, permissions,
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
    res.cookies.set("mp-session", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

function getSecret(): Uint8Array {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(s);
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

  const rateResult = checkRateLimit(`2fa:${ip}`);
  if (!rateResult.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => null);
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!userId || !code) {
      return NextResponse.json({ error: "Missing userId or code" }, { status: 400 });
    }

    const result = verifyOtp(userId, code);

    if (result !== "ok") {
      const msg =
        result === "expired" ? "Code has expired. Please log in again." :
        result === "max_attempts" ? "Too many incorrect attempts. Please log in again." :
        "Invalid code.";
      await prisma.auditLog.create({
        data: { action: "LOGIN_FAIL_2FA", userId, ipAddress: ip, userAgent, detail: `2FA failed: ${result}` },
      }).catch(() => {});
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    // Fetch full user to build JWT
    const user = await prisma.user.findUnique({
      where: { id: userId, userStatus: 1 },
      include: {
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found or inactive" }, { status: 401 });
    }

    resetRateLimit(`2fa:${ip}`);

    await prisma.auditLog.create({
      data: { action: "LOGIN_SUCCESS", userId: user.id, ipAddress: ip, userAgent, detail: `2FA login: ${user.email}` },
    }).catch(() => {});

    const roles = user.roles.map((ur: any) => ur.role.name);
    const permissions = user.roles.flatMap((ur: any) =>
      ur.role.permissions.map((rp: any) => rp.permission.name)
    );

    const token = await new SignJWT({
      id: user.id, name: user.name, email: user.email,
      username: user.username,
      customerId: user.customerId ?? null,
      driverId: user.driverId ?? null,
      dcontactId: user.dcontactId ?? null,
      roles, permissions,
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
      maxAge: 60 * 60 * 8,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
