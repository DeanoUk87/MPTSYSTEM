import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { generateTotpSecret } from "@/lib/totp";
import QRCode from "qrcode";

/**
 * GET /api/users/[id]/2fa-setup
 * Generate a new TOTP secret + QR code data URL for the user.
 * Does NOT save to DB yet — user must verify first.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Only admins or the user themselves
  const isAdmin = !session.customerId && !session.driverId && !session.dcontactId;
  if (!isAdmin && session.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { secret, otpAuthUrl } = generateTotpSecret(user.email);
  const qrDataUrl = await QRCode.toDataURL(otpAuthUrl, { width: 256, margin: 2 });

  return NextResponse.json({ secret, qrDataUrl });
}

/**
 * POST /api/users/[id]/2fa-setup
 * Body: { secret, token } — verify the token matches the secret, then enable 2FA.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isAdmin = !session.customerId && !session.driverId && !session.dcontactId;
  if (!isAdmin && session.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const secret: string = body?.secret ?? "";
  const token: string = body?.token ?? "";

  if (!secret || !token) {
    return NextResponse.json({ error: "secret and token required" }, { status: 400 });
  }

  // Import verifyTotpToken dynamically to avoid edge runtime issues
  const { verifyTotpToken } = await import("@/lib/totp");
  if (!verifyTotpToken(secret, token)) {
    return NextResponse.json({ error: "Invalid code — please try again" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data: { twoFactorEnabled: true, totpSecret: secret },
  });

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/users/[id]/2fa-setup
 * Disable 2FA for the user.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isAdmin = !session.customerId && !session.driverId && !session.dcontactId;
  if (!isAdmin && session.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id },
    data: { twoFactorEnabled: false, totpSecret: null },
  });

  return NextResponse.json({ ok: true });
}
