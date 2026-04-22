/**
 * In-memory OTP store for 2FA login verification.
 * Keyed by userId. Each entry expires after 5 minutes.
 */

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

const store = new Map<string, OtpEntry>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function setOtp(userId: string, code: string): void {
  store.set(userId, { code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
}

export function verifyOtp(userId: string, code: string): "ok" | "invalid" | "expired" | "max_attempts" {
  const entry = store.get(userId);
  if (!entry) return "expired";
  if (Date.now() > entry.expiresAt) { store.delete(userId); return "expired"; }
  if (entry.attempts >= MAX_ATTEMPTS) { store.delete(userId); return "max_attempts"; }
  entry.attempts++;
  if (entry.code !== code) return "invalid";
  store.delete(userId);
  return "ok";
}

export function clearOtp(userId: string): void {
  store.delete(userId);
}
