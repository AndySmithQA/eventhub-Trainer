import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultDbPath, openDatabase, type Db } from "./db.js";

/**
 * Deterministic seed for demos and regression tests.
 * Capacities and bookings are varied so remaining capacity is non-trivial.
 */
export function seedDatabase(db: Db): void {
  db.exec(`
    DELETE FROM bookings;
    DELETE FROM sessions;
    DELETE FROM events;
    DELETE FROM users;
  `);

  const insertUser = db.prepare(
    `INSERT INTO users (id, name, email) VALUES (?, ?, ?)`
  );
  const insertEvent = db.prepare(
    `INSERT INTO events (id, title, description, venue) VALUES (?, ?, ?, ?)`
  );
  const insertSession = db.prepare(
    `INSERT INTO sessions (id, event_id, starts_at, ends_at, capacity)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertBooking = db.prepare(
    `INSERT INTO bookings (id, session_id, user_id, status, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );

  const users = [
    ["user-alice", "Alice Chen", "alice@example.com"],
    ["user-ben", "Ben Okonkwo", "ben@example.com"],
    ["user-cara", "Cara Patel", "cara@example.com"],
    ["user-diego", "Diego Ruiz", "diego@example.com"],
    ["user-elena", "Elena Novak", "elena@example.com"],
    ["user-farah", "Farah Ali", "farah@example.com"],
  ] as const;

  for (const u of users) insertUser.run(...u);

  const events = [
    [
      "evt-keynote",
      "Opening Keynote: Building Reliable Systems",
      "A morning keynote on reliability engineering practices.",
      "Main Hall",
    ],
    [
      "evt-workshop",
      "Hands-on Testing Workshop",
      "Interactive workshop covering automated testing strategies.",
      "Studio B",
    ],
    [
      "evt-panel",
      "Architecture Panel Discussion",
      "Panel of architects debating change-impact analysis.",
      "Theatre 2",
    ],
    [
      "evt-networking",
      "Evening Networking Mixer",
      "Informal networking with light refreshments.",
      "Rooftop Terrace",
    ],
  ] as const;

  for (const e of events) insertEvent.run(...e);

  // Varied capacity: spacious, nearly full, full, empty, tiny.
  const sessions = [
    [
      "ses-keynote-am",
      "evt-keynote",
      "2026-11-10T09:00:00.000Z",
      "2026-11-10T10:30:00.000Z",
      20,
    ],
    [
      "ses-keynote-pm",
      "evt-keynote",
      "2026-11-10T14:00:00.000Z",
      "2026-11-10T15:30:00.000Z",
      20,
    ],
    [
      "ses-workshop-a",
      "evt-workshop",
      "2026-11-11T10:00:00.000Z",
      "2026-11-11T12:00:00.000Z",
      7,
    ],
    [
      "ses-workshop-b",
      "evt-workshop",
      "2026-11-11T13:00:00.000Z",
      "2026-11-11T15:00:00.000Z",
      8,
    ],
    [
      "ses-panel",
      "evt-panel",
      "2026-11-12T11:00:00.000Z",
      "2026-11-12T12:30:00.000Z",
      12,
    ],
    [
      "ses-mixer",
      "evt-networking",
      "2026-11-12T17:00:00.000Z",
      "2026-11-12T19:00:00.000Z",
      30,
    ],
    [
      "ses-tiny",
      "evt-panel",
      "2026-11-13T09:00:00.000Z",
      "2026-11-13T09:45:00.000Z",
      2,
    ],
  ] as const;

  for (const s of sessions) insertSession.run(...s);

  const seededAt = "2026-10-01T12:00:00.000Z";

  // Remaining after seed:
  // ses-keynote-am: 17/20, ses-keynote-pm: 20/20 empty,
  // ses-workshop-a: 1/7, ses-workshop-b: 8/8 (one cancelled only),
  // ses-panel: 7/12, ses-mixer: 28/30, ses-tiny: 0/2 full
  const finalBookings: Array<[string, string, string, string, string]> = [
    ["bkg-1", "ses-keynote-am", "user-alice", "confirmed", seededAt],
    ["bkg-2", "ses-keynote-am", "user-ben", "confirmed", seededAt],
    ["bkg-3", "ses-keynote-am", "user-cara", "confirmed", seededAt],
    ["bkg-4", "ses-workshop-a", "user-alice", "confirmed", seededAt],
    ["bkg-5", "ses-workshop-a", "user-ben", "confirmed", seededAt],
    ["bkg-6", "ses-workshop-a", "user-cara", "confirmed", seededAt],
    ["bkg-7", "ses-workshop-a", "user-diego", "confirmed", seededAt],
    ["bkg-8", "ses-workshop-a", "user-elena", "confirmed", seededAt],
    ["bkg-9", "ses-workshop-a", "user-farah", "confirmed", seededAt],
    ["bkg-10", "ses-workshop-b", "user-diego", "cancelled", seededAt],
    ["bkg-11", "ses-panel", "user-alice", "confirmed", seededAt],
    ["bkg-12", "ses-panel", "user-ben", "confirmed", seededAt],
    ["bkg-13", "ses-panel", "user-cara", "confirmed", seededAt],
    ["bkg-14", "ses-panel", "user-diego", "confirmed", seededAt],
    ["bkg-15", "ses-panel", "user-elena", "confirmed", seededAt],
    ["bkg-16", "ses-tiny", "user-alice", "confirmed", seededAt],
    ["bkg-17", "ses-tiny", "user-ben", "confirmed", seededAt],
    ["bkg-18", "ses-mixer", "user-cara", "confirmed", seededAt],
    ["bkg-19", "ses-mixer", "user-farah", "confirmed", seededAt],
  ];

  for (const b of finalBookings) insertBooking.run(...b);
}

export function ensureSeededFileDb(dbPath: string = defaultDbPath()): Db {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const fresh = !fs.existsSync(dbPath);
  const db = openDatabase(dbPath);
  if (fresh) {
    seedDatabase(db);
  }
  return db;
}

const thisFile = fileURLToPath(import.meta.url);
const invokedAsMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(thisFile);

if (invokedAsMain) {
  const dbPath = defaultDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  const db = openDatabase(dbPath);
  seedDatabase(db);
  console.log(`Seeded database at ${dbPath}`);
  db.close();
}
