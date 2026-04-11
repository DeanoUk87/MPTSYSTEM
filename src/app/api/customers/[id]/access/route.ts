import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import bcrypt from "bcryptjs";

function generateUsername(customerName: string): string {
  return customerName
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

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  // Find or create the "customer" role
  let customerRole = await prisma.role.findUnique({ where: { name: "customer" } });
  if (!customerRole) {
    customerRole = await prisma.role.create({ data: { name: "customer" } });
  }

  const plainPassword = generatePassword();
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Check if a user already exists for this customer
  const existingUser = await prisma.user.findFirst({
    where: { customerId: id },
  });

  let username: string;
  let userId: string;

  if (existingUser) {
    // Reset their password
    username = existingUser.username ?? generateUsername(customer.name);
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { password: hashedPassword, userStatus: 1, username },
    });
    userId = existingUser.id;
  } else {
    // Generate a unique username
    let base = generateUsername(customer.name);
    username = base;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${base}${counter++}`;
    }

    const email = customer.email ?? `${username}@portal.local`;
    // Ensure email is unique
    let finalEmail = email;
    if (await prisma.user.findUnique({ where: { email } })) {
      finalEmail = `${username}_${Date.now()}@portal.local`;
    }

    const newUser = await prisma.user.create({
      data: {
        name: customer.name,
        email: finalEmail,
        username,
        password: hashedPassword,
        userStatus: 1,
        customerId: id,
      },
    });
    userId = newUser.id;
  }

  // Ensure the user has the customer role (idempotent)
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: customerRole.id } },
    create: { userId, roleId: customerRole.id },
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

  const user = await prisma.user.findFirst({
    where: { customerId: id },
    select: { id: true, username: true, userStatus: true, updatedAt: true },
  });

  return NextResponse.json({ hasAccess: !!user, user: user ?? null });
}
