import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import bcrypt from "bcryptjs";

function generateUsername(driverName: string): string {
  return driverName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 30);
}

function generatePassword(length = 10): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#";
  let pw = "";
  for (let i = 0; i < length; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const contactId: string | null = body.contactId || null;

  // Validate driver exists
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  let contactName: string | null = null;
  if (contactId) {
    const contact = await prisma.driverContact.findUnique({ where: { id: contactId } });
    if (!contact || contact.driverId !== id) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
    contactName = contact.driverName;
  }

  // Find or create the "driver" role
  let driverRole = await prisma.role.findUnique({ where: { name: "driver" } });
  if (!driverRole) {
    driverRole = await prisma.role.create({ data: { name: "driver" } });
    // Auto-assign driver_jobs_view permission
    const perm = await prisma.permission.findUnique({ where: { name: "driver_jobs_view" } });
    if (perm) {
      await prisma.rolePermission.create({
        data: { roleId: driverRole.id, permissionId: perm.id },
      });
    }
  }

  const displayName = contactName || driver.name;
  const plainPassword = generatePassword();
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Check if user already exists for this driver/contact combo
  const existingUser = contactId
    ? await prisma.user.findFirst({ where: { dcontactId: contactId } })
    : await prisma.user.findFirst({ where: { driverId: id, dcontactId: null } });

  let username: string;
  let userId: string;

  if (existingUser) {
    username = existingUser.username ?? generateUsername(displayName);
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { password: hashedPassword, userStatus: 1, username },
    });
    userId = existingUser.id;
  } else {
    let base = generateUsername(displayName);
    username = base;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${base}${counter++}`;
    }

    const email = `${username}@driver.local`;
    let finalEmail = email;
    if (await prisma.user.findUnique({ where: { email } })) {
      finalEmail = `${username}_${Date.now()}@driver.local`;
    }

    const newUser = await prisma.user.create({
      data: {
        name: displayName,
        email: finalEmail,
        username,
        password: hashedPassword,
        userStatus: 1,
        driverId: id,
        dcontactId: contactId,
      },
    });
    userId = newUser.id;
  }

  // Ensure the user has the driver role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: driverRole.id } },
    create: { userId, roleId: driverRole.id },
    update: {},
  });

  return NextResponse.json({ username, password: plainPassword });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Get all users linked to this driver (main + contacts)
  const users = await prisma.user.findMany({
    where: { driverId: id },
    select: { id: true, username: true, dcontactId: true, userStatus: true },
  });

  return NextResponse.json(users);
}
