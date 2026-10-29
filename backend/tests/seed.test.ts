import { describe, expect, it } from "vitest";
import { remainingCapacity } from "../src/services/capacity.js";
import { createTestDb } from "./helpers.js";

describe("seed data", () => {
  it("creates users, events, and seven sessions with varied capacity", () => {
    const db = createTestDb();
    expect(
      Number(
        (db.prepare(`SELECT COUNT(*) AS c FROM users`).get() as { c: number }).c
      )
    ).toBe(6);
    expect(
      Number(
        (db.prepare(`SELECT COUNT(*) AS c FROM events`).get() as { c: number }).c
      )
    ).toBe(4);
    expect(
      Number(
        (db.prepare(`SELECT COUNT(*) AS c FROM sessions`).get() as { c: number })
          .c
      )
    ).toBe(7);
    const capacities = (
      db.prepare(`SELECT capacity FROM sessions ORDER BY capacity`).all() as Array<{
        capacity: number;
      }>
    ).map((r) => Number(r.capacity));
    expect(capacities).toEqual([2, 7, 8, 12, 20, 20, 30]);
  });

  it("seeds confirmed and cancelled bookings", () => {
    const db = createTestDb();
    const confirmed = db
      .prepare(
        `SELECT COUNT(*) AS c FROM bookings WHERE status = 'confirmed'`
      )
      .get() as { c: number };
    const cancelled = db
      .prepare(
        `SELECT COUNT(*) AS c FROM bookings WHERE status = 'cancelled'`
      )
      .get() as { c: number };
    expect(Number(confirmed.c)).toBeGreaterThan(10);
    expect(Number(cancelled.c)).toBe(1);
  });

  it("leaves workshop-a with one seat remaining", () => {
    const db = createTestDb();
    expect(remainingCapacity(db, "ses-workshop-a")).toBe(1);
  });

  it("leaves tiny session fully booked", () => {
    const db = createTestDb();
    expect(remainingCapacity(db, "ses-tiny")).toBe(0);
  });

  it("leaves keynote-pm empty", () => {
    const db = createTestDb();
    expect(remainingCapacity(db, "ses-keynote-pm")).toBe(20);
  });
});
