import { describe, expect, it } from "vitest";
import {
  countConfirmedBookings,
  getSessionCapacity,
  hasCapacity,
  remainingCapacity,
} from "../src/services/capacity.js";
import { createTestDb } from "./helpers.js";

describe("capacity calculation", () => {
  it("reads session capacity from the database", () => {
    const db = createTestDb();
    expect(getSessionCapacity(db, "ses-workshop-a")).toBe(7);
    expect(getSessionCapacity(db, "ses-tiny")).toBe(2);
    expect(getSessionCapacity(db, "missing")).toBeNull();
  });

  it("counts only confirmed bookings toward capacity", () => {
    const db = createTestDb();
    // workshop-b has one cancelled booking only
    expect(countConfirmedBookings(db, "ses-workshop-b")).toBe(0);
    expect(countConfirmedBookings(db, "ses-workshop-a")).toBe(6);
  });

  it("computes remaining capacity for a nearly full session", () => {
    const db = createTestDb();
    expect(remainingCapacity(db, "ses-workshop-a")).toBe(1);
  });

  it("computes remaining capacity for a full session", () => {
    const db = createTestDb();
    expect(remainingCapacity(db, "ses-tiny")).toBe(0);
  });

  it("computes remaining capacity for an empty session", () => {
    const db = createTestDb();
    expect(remainingCapacity(db, "ses-keynote-pm")).toBe(20);
  });

  it("reports hasCapacity based on remaining seats", () => {
    const db = createTestDb();
    expect(hasCapacity(db, "ses-workshop-a", 1)).toBe(true);
    expect(hasCapacity(db, "ses-tiny", 1)).toBe(false);
  });

  it("does not treat cancelled bookings as occupying seats", () => {
    const db = createTestDb();
    expect(remainingCapacity(db, "ses-workshop-b")).toBe(8);
  });
});
