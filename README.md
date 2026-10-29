# EventHub (Day 4 starter)

Working **individual** event booking app for YouView / QA training.

Delegates inherit this product and extend it with **group bookings** and **waitlists**. Those features are intentionally absent — leave the TODOs alone until the challenge brief says otherwise.

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

On first API start, SQLite is created and seeded at `data/eventhub.db`.

Re-seed (wipes local DB):

```bash
npm run seed
```

## Tests

```bash
npm test
```

Backend Vitest suite (**40 tests**) covers capacity, booking, cancel, duplicates, overbooking, and seed integrity. Treat failures as regression bait when adding groups/waitlists.

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

## Intentionally missing

| Capability | Starter stance |
| --- | --- |
| Group bookings | TODO comments only — no party size / partial allocation |
| Waitlists | TODO comments only — no queue or auto-promotion |
| Waitlist explainability | Out of scope until teams design it |

Do **not** add partial implementations that spoil the challenge.

## Project layout

```
backend/     Express API, SQLite, seed, Vitest
frontend/    React UI
data/        SQLite file (generated)
```

## Docs

- `USER_GUIDE.md` — delegate walkthrough
- `FACILITATOR.md` — trainer notes (do not hand to delegates as the brief)
