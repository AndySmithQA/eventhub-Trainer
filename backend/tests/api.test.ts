import request from "supertest";
import { describe, expect, it } from "vitest";
import { remainingCapacity } from "../src/services/capacity.js";
import { createTestApp } from "./helpers.js";

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe("GET /api/users", () => {
  it("lists seeded users", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(6);
    expect(res.body[0]).toHaveProperty("email");
  });
});

describe("GET /api/events", () => {
  it("lists events", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/events");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(4);
    expect(res.body.every((e: { title: string }) => e.title)).toBe(true);
  });
});

describe("GET /api/events/:id", () => {
  it("returns event detail with session capacity", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/events/evt-keynote");
    expect(res.status).toBe(200);
    expect(res.body.sessions).toHaveLength(2);
    const am = res.body.sessions.find(
      (s: { id: string }) => s.id === "ses-keynote-am"
    );
    expect(am.remainingCapacity).toBe(17);
    expect(am.bookedCount).toBe(3);
  });

  it("returns 404 for unknown event", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/events/evt-missing");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/sessions/:id", () => {
  it("returns session with remaining capacity", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/sessions/ses-tiny");
    expect(res.status).toBe(200);
    expect(res.body.remainingCapacity).toBe(0);
    expect(res.body.capacity).toBe(2);
  });
});

describe("POST /api/bookings", () => {
  it("creates an individual booking", async () => {
    const { app, db } = createTestApp();
    const before = remainingCapacity(db, "ses-keynote-pm")!;
    const res = await request(app)
      .post("/api/bookings")
      .send({ sessionId: "ses-keynote-pm", userId: "user-elena" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("confirmed");
    expect(remainingCapacity(db, "ses-keynote-pm")).toBe(before - 1);
  });

  it("returns 409 when session is full", async () => {
    const { app } = createTestApp();
    const res = await request(app)
      .post("/api/bookings")
      .send({ sessionId: "ses-tiny", userId: "user-cara" });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("FULL");
  });

  it("returns 409 on duplicate booking", async () => {
    const { app } = createTestApp();
    const res = await request(app)
      .post("/api/bookings")
      .send({ sessionId: "ses-keynote-am", userId: "user-alice" });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("DUPLICATE");
  });

});

describe("DELETE /api/bookings/:id", () => {
  it("cancels a booking and frees capacity", async () => {
    const { app, db } = createTestApp();
    const res = await request(app).delete("/api/bookings/bkg-16");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("cancelled");
    expect(remainingCapacity(db, "ses-tiny")).toBe(1);
  });

  it("returns 409 when already cancelled", async () => {
    const { app } = createTestApp();
    const res = await request(app).delete("/api/bookings/bkg-10");
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("ALREADY_CANCELLED");
  });

});

describe("GET /api/users/:id/bookings", () => {
  it("lists bookings for a user", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/users/user-alice/bookings");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("eventTitle");
  });
});

describe("individual booking regression flows", () => {
  it("book then cancel restores capacity", async () => {
    const { app, db } = createTestApp();
    const before = remainingCapacity(db, "ses-mixer")!;
    const created = await request(app)
      .post("/api/bookings")
      .send({ sessionId: "ses-mixer", userId: "user-alice" });
    expect(created.status).toBe(201);
    expect(remainingCapacity(db, "ses-mixer")).toBe(before - 1);

    const cancelled = await request(app).delete(
      `/api/bookings/${created.body.id}`
    );
    expect(cancelled.status).toBe(200);
    expect(remainingCapacity(db, "ses-mixer")).toBe(before);
  });

  it("does not allow overbooking the last seat twice", async () => {
    const { app, db } = createTestApp();
    db.prepare(
      `INSERT INTO users (id, name, email) VALUES (?, ?, ?)`
    ).run("user-gina", "Gina Lee", "gina@example.com");
    db.prepare(
      `INSERT INTO users (id, name, email) VALUES (?, ?, ?)`
    ).run("user-hiro", "Hiro Sato", "hiro@example.com");

    const first = await request(app)
      .post("/api/bookings")
      .send({ sessionId: "ses-workshop-a", userId: "user-gina" });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/api/bookings")
      .send({ sessionId: "ses-workshop-a", userId: "user-hiro" });
    expect(second.status).toBe(409);
    expect(second.body.code).toBe("FULL");
    expect(remainingCapacity(db, "ses-workshop-a")).toBe(0);
  });
});
