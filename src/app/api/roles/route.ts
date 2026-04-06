import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const roles = await prisma.role.findMany({
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(roles);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, permissionIds } = await req.json();
  const role = await prisma.role.create({ data: { name } });
  if (permissionIds?.length) {
    for (const permissionId of permissionIds) {
      await prisma.rolePermission.create({ data: { roleId: role.id, permissionId } });
    }
  }
  return NextResponse.json(role, { status: 201 });
}
