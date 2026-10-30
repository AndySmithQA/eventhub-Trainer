# EventHub

Working event booking app. Browse sessions, see remaining places, book a seat, and cancel.

## What works today

- Browse events and sessions
- See remaining capacity
- Book an individual place
- Cancel a booking
- View your bookings

## Stack

| Layer | Tech |
| --- | --- |
| UI | React + TypeScript (Vite) |
| API | Node + TypeScript (Express) |
| DB | SQLite via Node built-in `node:sqlite` |

No Docker. No external services. No API keys.

## Quick start

Requires **Node.js 22+** (for `node:sqlite`).

```bash
npm install
npm run dev
```

- UI: http://localhost:5173  
- API: http://localhost:4000  

On first API start, SQLite is created and seeded at `data/eventhub.db` inside this clone. `npm run seed` creates that `data/` folder on your machine if it is missing, then writes the database. The file is gitignored, so each clone keeps its own copy.

Re-seed (wipes this clone's database):

```bash
npm run seed
```

## Tests

```bash
npm test
```

Backend Vitest suite (**40 tests**) covers capacity, booking, cancel, duplicates, overbooking, and seed integrity.

## Domain model

```
User ──< Booking >── Session >── Event
              │
         status: confirmed | cancelled
```

- **Event** — titled offering with venue
- **Session** — timed occurrence with `capacity`
- **User** — attendee (demo switcher in the UI; no auth)
- **Booking** — one confirmed seat per user per session
- **Remaining capacity** = `session.capacity − count(confirmed bookings)`

Cancelled bookings do not consume capacity.

## Project layout

```
backend/     Express API, SQLite, seed, Vitest
frontend/    React UI
data/        local SQLite file, created by seed or first API start (gitignored)
```

## Docs

- `USER_GUIDE.md` — how to run and use the app
