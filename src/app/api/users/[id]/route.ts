import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { name, email, username, password, roleId, userStatus, twoFactorEnabled } = await req.json();

  const data: any = { name, email, userStatus };
  if (username !== undefined) data.username = username || null;
  if (password) data.password = await bcrypt.hash(password, 12);
  if (twoFactorEnabled !== undefined) data.twoFactorEnabled = !!twoFactorEnabled;

  const user = await prisma.user.update({ where: { id }, data });

  if (roleId !== undefined) {
    await prisma.userRole.deleteMany({ where: { userId: id } });
    if (roleId) {
      await prisma.userRole.create({ data: { userId: id, roleId } });
    }
  }

  return NextResponse.json({ id: user.id });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
