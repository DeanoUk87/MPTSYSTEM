interface LockEntry {
  userId: string;
  userName: string;
  lockedAt: Date;
  requester: { id: string; name: string } | null;
  response: "pending" | "allowed" | "denied" | null;
}

const locks = new Map<string, LockEntry>();
const LOCK_TTL_MS = 15 * 60 * 1000; // 15 minutes

function isExpired(entry: LockEntry) {
  return Date.now() - entry.lockedAt.getTime() > LOCK_TTL_MS;
}

export function getLock(bookingId: string): LockEntry | null {
  const entry = locks.get(bookingId);
  if (!entry) return null;
  if (isExpired(entry)) { locks.delete(bookingId); return null; }
  return entry;
}

export function acquireLock(bookingId: string, userId: string, userName: string): boolean {
  const existing = getLock(bookingId);
  if (existing && existing.userId !== userId) return false;
  locks.set(bookingId, { userId, userName, lockedAt: new Date(), requester: existing?.requester ?? null, response: existing?.response ?? null });
  return true;
}

export function renewLock(bookingId: string, userId: string): LockEntry | null {
  const existing = getLock(bookingId);
  if (!existing || existing.userId !== userId) return null;
  existing.lockedAt = new Date();
  return existing;
}

export function releaseLock(bookingId: string, userId: string): boolean {
  const existing = getLock(bookingId);
  if (!existing || existing.userId !== userId) return false;
  locks.delete(bookingId);
  return true;
}

export function forceLock(bookingId: string, userId: string, userName: string): void {
  locks.set(bookingId, { userId, userName, lockedAt: new Date(), requester: null, response: null });
}

export function setRequester(bookingId: string, requesterId: string, requesterName: string): boolean {
  const existing = getLock(bookingId);
  if (!existing) return false;
  existing.requester = { id: requesterId, name: requesterName };
  existing.response = "pending";
  return true;
}

export function respondToRequest(bookingId: string, ownerId: string, decision: "allowed" | "denied"): boolean {
  const existing = getLock(bookingId);
  if (!existing || existing.userId !== ownerId) return false;
  existing.response = decision;
  return true;
}
