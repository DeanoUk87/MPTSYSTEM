import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const SECRET = process.env.NEXTAUTH_SECRET ?? "mp-booking-fallback-secret-change-in-production";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("mp-session")?.value;
  if (!token) return NextResponse.json(null);
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(SECRET));

    // Re-fetch permissions live from DB so role/permission changes take effect without re-login
    const userId = (payload as any).id as string | undefined;
    if (userId) {
      const userWithRoles = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          roles: {
            select: {
              role: {
                select: {
                  name: true,
                  permissions: { select: { permission: { select: { name: true } } } },
                },
              },
            },
          },
        },
      });

      if (userWithRoles) {
        const roles = userWithRoles.roles.map(ur => ur.role.name);
        const permissions = [
          ...new Set(
            userWithRoles.roles.flatMap(ur =>
              ur.role.permissions.map(rp => rp.permission.name)
            )
          ),
        ];
        return NextResponse.json({ ...payload, roles, permissions });
      }
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(null);
  }
}
