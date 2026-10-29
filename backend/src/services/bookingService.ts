import { randomUUID } from "node:crypto";
import type { Db } from "../db.js";
import type { Booking, BookingView, SessionWithCapacity } from "../types.js";
import {
  countConfirmedBookings,
  hasCapacity,
  remainingCapacity,
} from "./capacity.js";

export class BookingError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "FULL"
      | "DUPLICATE"
      | "INVALID"
      | "ALREADY_CANCELLED"
  ) {
    super(message);
    this.name = "BookingError";
  }
}

function mapBooking(row: Record<string, unknown>): Booking {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    userId: String(row.user_id),
    status: row.status as Booking["status"],
    createdAt: String(row.created_at),
  };
}

export function listSessionsForEvent(
  db: Db,
  eventId: string
): SessionWithCapacity[] {
  const rows = db
    .prepare(
      `SELECT id, event_id, starts_at, ends_at, capacity
       FROM sessions
       WHERE event_id = ?
       ORDER BY starts_at ASC`
    )
    .all(eventId) as Array<Record<string, unknown>>;

  return rows.map((row) => {
    const id = String(row.id);
    const capacity = Number(row.capacity);
    const bookedCount = countConfirmedBookings(db, id);
    return {
      id,
      eventId: String(row.event_id),
      startsAt: String(row.starts_at),
      endsAt: String(row.ends_at),
      capacity,
      bookedCount,
      remainingCapacity: capacity - bookedCount,
    };
  });
}

export function getSessionWithCapacity(
  db: Db,
  sessionId: string
): SessionWithCapacity | null {
  const row = db
    .prepare(
      `SELECT id, event_id, starts_at, ends_at, capacity
       FROM sessions WHERE id = ?`
    )
    .get(sessionId) as Record<string, unknown> | undefined;
  if (!row) return null;
  const capacity = Number(row.capacity);
  const bookedCount = countConfirmedBookings(db, sessionId);
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    capacity,
    bookedCount,
    remainingCapacity: capacity - bookedCount,
  };
}

/**
 * Create an individual (1-seat) confirmed booking.
 *
 * TODO(challenge): accept partySize / attendeeIds for group bookings.
 * TODO(challenge): if insufficient capacity, offer waitlist instead of FULL.
 */
export function createBooking(
  db: Db,
  sessionId: string,
  userId: string
): Booking {
  const session = db
    .prepare(`SELECT id FROM sessions WHERE id = ?`)
    .get(sessionId);
  if (!session) {
    throw new BookingError("Session not found", "NOT_FOUND");
  }

  const user = db.prepare(`SELECT id FROM users WHERE id = ?`).get(userId);
  if (!user) {
    throw new BookingError("User not found", "NOT_FOUND");
  }

  const existing = db
    .prepare(
      `SELECT id FROM bookings
       WHERE session_id = ? AND user_id = ? AND status = 'confirmed'`
    )
    .get(sessionId, userId);
  if (existing) {
    throw new BookingError(
      "User already has a confirmed booking for this session",
      "DUPLICATE"
    );
  }

  if (!hasCapacity(db, sessionId, 1)) {
    // TODO(challenge): join waitlist when full / partial group fit fails.
    throw new BookingError("Session is fully booked", "FULL");
  }

  const booking: Booking = {
    id: randomUUID(),
    sessionId,
    userId,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO bookings (id, session_id, user_id, status, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    booking.id,
    booking.sessionId,
    booking.userId,
    booking.status,
    booking.createdAt
  );

  return booking;
}

/**
 * Cancel a confirmed booking and free one place.
 *
 * TODO(challenge): after cancel, evaluate waitlist and auto-promote
 * (fairness / fit rules are a stakeholder CLARIFY topic — do not hard-code answers).
 */
export function cancelBooking(db: Db, bookingId: string): Booking {
  const row = db
    .prepare(
      `SELECT id, session_id, user_id, status, created_at
       FROM bookings WHERE id = ?`
    )
    .get(bookingId) as Record<string, unknown> | undefined;

  if (!row) {
    throw new BookingError("Booking not found", "NOT_FOUND");
  }

  if (row.status === "cancelled") {
    throw new BookingError("Booking is already cancelled", "ALREADY_CANCELLED");
  }

  db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`).run(
    bookingId
  );

  // Capacity is freed by status change (confirmed count drops).
  // TODO(challenge): trigger waitlist promotion here.

  return {
    ...mapBooking(row),
    status: "cancelled",
  };
}

export function listUserBookings(db: Db, userId: string): BookingView[] {
  const rows = db
    .prepare(
      `SELECT
         b.id, b.session_id, b.user_id, b.status, b.created_at,
         e.title AS event_title,
         s.starts_at AS session_starts_at,
         s.ends_at AS session_ends_at,
         e.venue,
         u.name AS user_name
       FROM bookings b
       JOIN sessions s ON s.id = b.session_id
       JOIN events e ON e.id = s.event_id
       JOIN users u ON u.id = b.user_id
       WHERE b.user_id = ?
       ORDER BY s.starts_at ASC, b.created_at ASC`
    )
    .all(userId) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: String(row.id),
    sessionId: String(row.session_id),
    userId: String(row.user_id),
    status: row.status as Booking["status"],
    createdAt: String(row.created_at),
    eventTitle: String(row.event_title),
    sessionStartsAt: String(row.session_starts_at),
    sessionEndsAt: String(row.session_ends_at),
    venue: String(row.venue),
    userName: String(row.user_name),
  }));
}

export function assertRemaining(
  db: Db,
  sessionId: string,
  expected: number
): void {
  const actual = remainingCapacity(db, sessionId);
  if (actual !== expected) {
    throw new Error(
      `Capacity mismatch for ${sessionId}: expected ${expected}, got ${actual}`
    );
  }
}
