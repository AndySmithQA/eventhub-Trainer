import { describe, expect, it } from "vitest";
import {
  BookingError,
  cancelBooking,
  createBooking,
  listSessionsForEvent,
  listUserBookings,
} from "../src/services/bookingService.js";
import { remainingCapacity } from "../src/services/capacity.js";
import { createTestDb } from "./helpers.js";

describe("createBooking (individual)", () => {
  it("books a place when capacity remains", () => {
    const db = createTestDb();
    const before = remainingCapacity(db, "ses-keynote-pm")!;
    const booking = createBooking(db, "ses-keynote-pm", "user-alice");
    expect(booking.status).toBe("confirmed");
    expect(booking.sessionId).toBe("ses-keynote-pm");
    expect(booking.userId).toBe("user-alice");
    expect(remainingCapacity(db, "ses-keynote-pm")).toBe(before - 1);
  });

  it("reduces remaining capacity by exactly one", () => {
    const db = createTestDb();
    const before = remainingCapacity(db, "ses-mixer")!;
    createBooking(db, "ses-mixer", "user-alice");
    expect(remainingCapacity(db, "ses-mixer")).toBe(before - 1);
  });

  it("fills the last seat on a nearly full session", () => {
    const db = createTestDb();
    // workshop-a has all 6 users booked — need a different approach
    // Actually all 6 users are on workshop-a. Last seat can't be filled by seed users.
    // Use keynote-am which has 3 booked, alice already booked — use farah for last... many seats.
    // For last seat: ses-workshop-a has 1 remaining but all 6 users already booked.
    // So create a new user inline for this test.
    db.prepare(
      `INSERT INTO users (id, name, email) VALUES (?, ?, ?)`
    ).run("user-gina", "Gina Lee", "gina@example.com");
    expect(remainingCapacity(db, "ses-workshop-a")).toBe(1);
    createBooking(db, "ses-workshop-a", "user-gina");
    expect(remainingCapacity(db, "ses-workshop-a")).toBe(0);
  });

  it("rejects booking when session is full", () => {
    const db = createTestDb();
    expect(() => createBooking(db, "ses-tiny", "user-cara")).toThrow(
      BookingError
    );
    try {
      createBooking(db, "ses-tiny", "user-cara");
    } catch (err) {
      expect(err).toBeInstanceOf(BookingError);
      expect((err as BookingError).code).toBe("FULL");
    }
  });

  it("rejects duplicate confirmed booking for same user and session", () => {
    const db = createTestDb();
    expect(() => createBooking(db, "ses-keynote-am", "user-alice")).toThrow(
      BookingError
    );
    try {
      createBooking(db, "ses-keynote-am", "user-alice");
    } catch (err) {
      expect((err as BookingError).code).toBe("DUPLICATE");
    }
  });

  it("rejects booking for unknown session or user", () => {
    const db = createTestDb();
    try {
      createBooking(db, "ses-missing", "user-alice");
      expect.unreachable();
    } catch (err) {
      expect((err as BookingError).code).toBe("NOT_FOUND");
    }
    try {
      createBooking(db, "ses-keynote-pm", "user-missing");
      expect.unreachable();
    } catch (err) {
      expect((err as BookingError).code).toBe("NOT_FOUND");
    }
  });

  it("allows rebooking after a previous booking was cancelled", () => {
    const db = createTestDb();
    // diego has cancelled booking on workshop-b
    const booking = createBooking(db, "ses-workshop-b", "user-diego");
    expect(booking.status).toBe("confirmed");
    expect(remainingCapacity(db, "ses-workshop-b")).toBe(7);
  });
});

describe("cancelBooking", () => {
  it("cancels a confirmed booking and frees capacity", () => {
    const db = createTestDb();
    const before = remainingCapacity(db, "ses-tiny")!;
    expect(before).toBe(0);
    const cancelled = cancelBooking(db, "bkg-16");
    expect(cancelled.status).toBe("cancelled");
    expect(remainingCapacity(db, "ses-tiny")).toBe(1);
  });

  it("rejects cancelling an already cancelled booking", () => {
    const db = createTestDb();
    try {
      cancelBooking(db, "bkg-10");
      expect.unreachable();
    } catch (err) {
      expect((err as BookingError).code).toBe("ALREADY_CANCELLED");
    }
  });

  it("rejects cancelling a missing booking", () => {
    const db = createTestDb();
    try {
      cancelBooking(db, "bkg-missing");
      expect.unreachable();
    } catch (err) {
      expect((err as BookingError).code).toBe("NOT_FOUND");
    }
  });

  it("allows a different user to take a freed seat", () => {
    const db = createTestDb();
    cancelBooking(db, "bkg-17"); // frees seat on tiny (alice still booked)
    const booking = createBooking(db, "ses-tiny", "user-cara");
    expect(booking.status).toBe("confirmed");
    expect(remainingCapacity(db, "ses-tiny")).toBe(0);
  });
});

describe("session and booking queries", () => {
  it("lists sessions for an event with capacity fields", () => {
    const db = createTestDb();
    const sessions = listSessionsForEvent(db, "evt-workshop");
    expect(sessions).toHaveLength(2);
    const a = sessions.find((s) => s.id === "ses-workshop-a")!;
    expect(a.capacity).toBe(7);
    expect(a.bookedCount).toBe(6);
    expect(a.remainingCapacity).toBe(1);
  });

  it("lists a user's bookings including cancelled ones", () => {
    const db = createTestDb();
    const bookings = listUserBookings(db, "user-diego");
    expect(bookings.length).toBeGreaterThanOrEqual(2);
    expect(bookings.some((b) => b.status === "cancelled")).toBe(true);
    expect(bookings.some((b) => b.status === "confirmed")).toBe(true);
    expect(bookings.every((b) => b.eventTitle && b.venue)).toBe(true);
  });

  it("returns empty list for a user with no bookings", () => {
    const db = createTestDb();
    db.prepare(
      `INSERT INTO users (id, name, email) VALUES (?, ?, ?)`
    ).run("user-new", "New User", "new@example.com");
    expect(listUserBookings(db, "user-new")).toEqual([]);
  });
});
