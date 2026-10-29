import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import type { Db } from "./db.js";
import {
  BookingError,
  cancelBooking,
  createBooking,
  getSessionWithCapacity,
  listSessionsForEvent,
  listUserBookings,
} from "./services/bookingService.js";
import type { Event, EventDetail, User } from "./types.js";

export function createApp(db: Db): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "eventhub-api" });
  });

  app.get("/api/users", (_req, res) => {
    const rows = db
      .prepare(`SELECT id, name, email FROM users ORDER BY name ASC`)
      .all() as Array<Record<string, unknown>>;
    const users: User[] = rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      email: String(r.email),
    }));
    res.json(users);
  });

  app.get("/api/events", (_req, res) => {
    const rows = db
      .prepare(
        `SELECT id, title, description, venue FROM events ORDER BY title ASC`
      )
      .all() as Array<Record<string, unknown>>;
    const events: Event[] = rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      description: String(r.description),
      venue: String(r.venue),
    }));
    res.json(events);
  });

  app.get("/api/events/:id", (req, res) => {
    const row = db
      .prepare(
        `SELECT id, title, description, venue FROM events WHERE id = ?`
      )
      .get(req.params.id) as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    const detail: EventDetail = {
      id: String(row.id),
      title: String(row.title),
      description: String(row.description),
      venue: String(row.venue),
      sessions: listSessionsForEvent(db, String(row.id)),
    };
    res.json(detail);
  });

  app.get("/api/sessions/:id", (req, res) => {
    const session = getSessionWithCapacity(db, req.params.id);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(session);
  });

  app.get("/api/users/:id/bookings", (req, res) => {
    const user = db
      .prepare(`SELECT id FROM users WHERE id = ?`)
      .get(req.params.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(listUserBookings(db, req.params.id));
  });

  app.post("/api/bookings", (req: Request, res: Response) => {
    const { sessionId, userId } = req.body ?? {};
    if (typeof sessionId !== "string" || typeof userId !== "string") {
      res.status(400).json({
        error: "sessionId and userId are required strings",
      });
      return;
    }
    try {
      const booking = createBooking(db, sessionId, userId);
      res.status(201).json(booking);
    } catch (err) {
      respondBookingError(res, err);
    }
  });

  app.delete("/api/bookings/:id", (req, res) => {
    try {
      const booking = cancelBooking(db, req.params.id);
      res.json(booking);
    } catch (err) {
      respondBookingError(res, err);
    }
  });

  return app;
}

function respondBookingError(res: Response, err: unknown): void {
  if (err instanceof BookingError) {
    const status =
      err.code === "NOT_FOUND"
        ? 404
        : err.code === "FULL" ||
            err.code === "DUPLICATE" ||
            err.code === "ALREADY_CANCELLED" ||
            err.code === "INVALID"
          ? 409
          : 400;
    res.status(status).json({ error: err.message, code: err.code });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
