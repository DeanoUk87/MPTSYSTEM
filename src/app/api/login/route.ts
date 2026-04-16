import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const SECRET = process.env.NEXTAUTH_SECRET ?? "mp-booking-fallback-secret-change-in-production";

export async function POST(req: NextRequest) {
  try {
    const { login, password } = await req.json();
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

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const roles = user.roles.map((ur: any) => ur.role.name);
    const permissions = user.roles.flatMap((ur: any) =>
      ur.role.permissions.map((rp: any) => rp.permission.name)
    );

    // Sign JWT
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
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(SECRET));

    const redirectTo = user.customerId ? "/portal" : user.driverId ? "/driver" : "/admin";
    const res = NextResponse.json({ ok: true, redirectTo });
    res.cookies.set("mp-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
