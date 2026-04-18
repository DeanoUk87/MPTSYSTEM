import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = process.env.NEXTAUTH_SECRET ?? "mp-booking-fallback-secret-change-in-production";

export async function requireAuth(req: NextRequest): Promise<{ id: string; roles: string[] } | null> {
  const token = req.cookies.get("mp-session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(SECRET));
    return payload as any;
  } catch {
    return null;
  }
}

export async function requireDriverAuth(req: NextRequest): Promise<{ id: string; dcontactId: string; name: string } | null> {
  const token = req.cookies.get("mp-session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(SECRET));
    if (!(payload as any).dcontactId) return null;
    return payload as any;
  } catch {
    return null;
  }
}
