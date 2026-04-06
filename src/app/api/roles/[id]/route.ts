import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { name, permissionIds } = await req.json();
  const role = await prisma.role.update({ where: { id }, data: { name } });
  if (permissionIds !== undefined) {
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    for (const permissionId of permissionIds) {
      await prisma.rolePermission.create({ data: { roleId: id, permissionId } });
    }
  }
  return NextResponse.json(role);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.role.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
