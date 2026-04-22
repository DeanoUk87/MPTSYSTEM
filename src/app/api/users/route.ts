import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const users = await prisma.user.findMany({
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        userStatus: u.userStatus,
        twoFactorEnabled: u.twoFactorEnabled,
        createdAt: u.createdAt,
        roles: u.roles.map((ur) => ({ id: ur.role.id, name: ur.role.name })),
      }))
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { name, email, username, password, roleId, twoFactorEnabled } = await req.json();
    if (!name || !email || !password) return NextResponse.json({ error: "name, email, password required" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, username: username || null, password: hashed, twoFactorEnabled: !!twoFactorEnabled },
    });

    if (roleId) {
      await prisma.userRole.create({ data: { userId: user.id, roleId } });
    }

    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
