import type { Db } from "../db.js";

/**
 * Confirmed bookings consume one place each (individual booking model).
 * remaining = capacity - confirmedCount
 *
 * TODO(challenge): when group bookings exist, capacity must account for party size.
 * TODO(challenge): waitlist entries must not consume capacity until promoted.
 */
export function countConfirmedBookings(db: Db, sessionId: string): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM bookings
       WHERE session_id = ? AND status = 'confirmed'`
    )
    .get(sessionId) as { count: number } | undefined;
  return Number(row?.count ?? 0);
}

export function getSessionCapacity(db: Db, sessionId: string): number | null {
  const row = db
    .prepare(`SELECT capacity FROM sessions WHERE id = ?`)
    .get(sessionId) as { capacity: number } | undefined;
  return row ? Number(row.capacity) : null;
}

export function remainingCapacity(db: Db, sessionId: string): number | null {
  const capacity = getSessionCapacity(db, sessionId);
  if (capacity === null) return null;
  return capacity - countConfirmedBookings(db, sessionId);
}

export function hasCapacity(db: Db, sessionId: string, seats = 1): boolean {
  const remaining = remainingCapacity(db, sessionId);
  if (remaining === null) return false;
  return remaining >= seats;
}
