import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET /api/portal/pod-access
// Returns whether the logged-in customer has POD Portal access enabled,
// and which folder they are assigned to start from
export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customerId = (session as any).customerId;
  if (!customerId) return NextResponse.json({ podManagerAccess: false, podFolderId: null });

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { podManagerAccess: true, podFolderId: true },
  });

  return NextResponse.json({
    podManagerAccess: customer?.podManagerAccess ?? false,
    podFolderId: customer?.podFolderId ?? null,
  });
}
