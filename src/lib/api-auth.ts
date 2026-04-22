import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function requireAuth(req: NextRequest): Promise<{ id: string; roles: string[]; permissions: string[]; customerId?: string | null; driverId?: string | null; dcontactId?: string | null } | null> {
  const token = req.cookies.get("mp-session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = (payload as any).id as string;
    if (!userId) return null;

    // Verify user is still active in DB (catches disabled accounts mid-session)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userStatus: true },
    });
    if (!user || user.userStatus !== 1) return null;

    return payload as any;
  } catch {
    return null;
  }
}

export async function requireDriverAuth(req: NextRequest): Promise<{ id: string; dcontactId: string; name: string } | null> {
  const token = req.cookies.get("mp-session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!(payload as any).dcontactId) return null;
    return payload as any;
  } catch {
    return null;
  }
}
