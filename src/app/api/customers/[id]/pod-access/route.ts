import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET /api/customers/[id]/pod-access
// Returns podManagerAccess flag, assigned podFolderId, and folder name
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { podManagerAccess: true, podFolderId: true },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch folder name if assigned
  let folderName: string | null = null;
  if (customer.podFolderId) {
    const folder = await prisma.podFolder.findUnique({
      where: { id: customer.podFolderId },
      select: { name: true },
    });
    folderName = folder?.name ?? null;
  }

  return NextResponse.json({
    podManagerAccess: customer.podManagerAccess,
    podFolderId: customer.podFolderId ?? null,
    folderName,
  });
}

// POST /api/customers/[id]/pod-access
// Body: { enabled?: boolean, podFolderId?: string | null }
// Sets podManagerAccess (toggle if enabled not provided) and/or assigns a folder
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.roles?.includes("admin");
  if (!isAdmin) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { podManagerAccess: true, podFolderId: true },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: any = {};

  // Toggle or set access flag
  if (typeof body.enabled === "boolean") {
    updateData.podManagerAccess = body.enabled;
  } else if (body.podFolderId === undefined) {
    // Pure toggle (no folder update in body)
    updateData.podManagerAccess = !customer.podManagerAccess;
  }

  // Set folder assignment if provided (null = unassign)
  if ("podFolderId" in body) {
    updateData.podFolderId = body.podFolderId || null;
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: updateData,
    select: { podManagerAccess: true, podFolderId: true },
  });

  // Fetch folder name
  let folderName: string | null = null;
  if (updated.podFolderId) {
    const folder = await prisma.podFolder.findUnique({
      where: { id: updated.podFolderId },
      select: { name: true },
    });
    folderName = folder?.name ?? null;
  }

  return NextResponse.json({
    podManagerAccess: updated.podManagerAccess,
    podFolderId: updated.podFolderId ?? null,
    folderName,
  });
}
