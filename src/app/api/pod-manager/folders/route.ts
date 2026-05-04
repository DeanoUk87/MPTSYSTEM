import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET /api/pod-manager/folders?parentId=&customerId=
export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId") || null;
  const customerId = searchParams.get("customerId") || undefined;

  // For customer portal sessions — check access is enabled
  if (session.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: { podManagerAccess: true, podFolderId: true },
    });
    if (!customer?.podManagerAccess) {
      return NextResponse.json({ error: "POD Manager access not enabled for this account" }, { status: 403 });
    }

    // When navigating inside the folder tree (parentId provided), don't filter by customerId —
    // sub-folders created by admin have customerId=null. Security is enforced by the folder tree
    // structure: the customer can only reach these folders by navigating from their assigned root.
    // At root level (no parentId), restrict to their assigned root folder only.
    if (!parentId) {
      // Root level — only show the assigned folder
      const assignedFolderId = customer.podFolderId;
      if (!assignedFolderId) return NextResponse.json([]);
      const folder = await prisma.podFolder.findUnique({
        where: { id: assignedFolderId, deletedAt: null },
        include: {
          _count: { select: { files: { where: { deletedAt: null } }, children: { where: { deletedAt: null } } } },
          customer: { select: { id: true, name: true } },
        },
      });
      return NextResponse.json(folder ? [folder] : []);
    }

    // Inside the tree — return sub-folders without customerId filter
    try {
      const folders = await prisma.podFolder.findMany({
        where: { parentId, deletedAt: null },
        orderBy: { name: "asc" },
        include: {
          _count: { select: { files: { where: { deletedAt: null } }, children: { where: { deletedAt: null } } } },
          customer: { select: { id: true, name: true } },
        },
      });
      return NextResponse.json(folders);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // Admin / staff path — use customerId filter if provided
  const effectiveCustomerId = customerId || undefined;

  try {
    const folders = await prisma.podFolder.findMany({
      where: {
        parentId: parentId ?? null,
        deletedAt: null,
        ...(effectiveCustomerId ? { customerId: effectiveCustomerId } : {}),
      },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { files: { where: { deletedAt: null } }, children: { where: { deletedAt: null } } } },
        customer: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(folders);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/pod-manager/folders — create a folder
export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, parentId, customerId } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  // Check pod_manager_manage permission
  const canManage = session.roles?.includes("admin") || session.permissions?.includes("pod_manager_manage");
  if (!canManage) return NextResponse.json({ error: "Permission denied" }, { status: 403 });

  try {
    const folder = await prisma.podFolder.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
        customerId: customerId || null,
        createdById: session.id,
      },
    });
    return NextResponse.json(folder);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
