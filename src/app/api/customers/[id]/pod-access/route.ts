import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET /api/customers/[id]/pod-access — returns current podManagerAccess value
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { podManagerAccess: true },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ podManagerAccess: customer.podManagerAccess });
}

// POST /api/customers/[id]/pod-access — toggle or set podManagerAccess
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.roles?.includes("admin");
  if (!isAdmin) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { podManagerAccess: true },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If body has explicit value use it, otherwise toggle
  const newValue = typeof body.enabled === "boolean" ? body.enabled : !customer.podManagerAccess;

  const updated = await prisma.customer.update({
    where: { id },
    data: { podManagerAccess: newValue },
    select: { podManagerAccess: true },
  });

  return NextResponse.json({ podManagerAccess: updated.podManagerAccess });
}
