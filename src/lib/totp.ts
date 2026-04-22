import { TOTP, Secret } from "otpauth";

const ISSUER = process.env.TOTP_ISSUER || "MP System";

/**
 * Generate a new TOTP secret for a user.
 * Returns the base32 secret (to store in DB) and the otpauth:// URI (for QR code).
 */
export function generateTotpSecret(userEmail: string): { secret: string; otpAuthUrl: string } {
  const secret = new Secret({ size: 20 });
  const totp = new TOTP({
    issuer: ISSUER,
    label: userEmail,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
  return {
    secret: secret.base32,
    otpAuthUrl: totp.toString(),
  };
}

/**
 * Verify a TOTP token against a stored base32 secret.
 * Allows 1-step window (±30s) to account for clock drift.
 */
export function verifyTotpToken(base32Secret: string, token: string): boolean {
  try {
    const totp = new TOTP({
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(base32Secret),
    });
    const delta = totp.validate({ token: token.replace(/\s/g, ""), window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}
