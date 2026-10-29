# EventHub — user guide (delegates)

## Run the app

```bash
npm install
npm run dev
```

Open http://localhost:5173. The API runs on port 4000; the Vite dev server proxies `/api`.

## Demo users

Use **Acting as** in the header to switch seeded users (Alice, Ben, Cara, Diego, Elena, Farah). There is no login — this is a training demo.

## Browse and book

1. Open **Events**.
2. Choose an event → **View sessions**.
3. Check **places remaining**.
4. Click **Book place** (one seat for the current user).
5. Open **My bookings** to confirm.

Full sessions show **Full** and cannot be booked.

## Cancel

On **My bookings**, cancel a confirmed booking. Capacity on that session increases by one. Cancelled rows remain visible for history.

## Seeded scenarios worth noticing

| Session | Situation |
| --- | --- |
| Keynote AM | Several places already taken |
| Keynote PM | Empty — easy booking |
| Workshop A | Capacity 7, six booked — one seat left |
| Tiny panel slot | Fully booked |
| Workshop B | Open (one historical cancelled booking only) |

Re-seed after experiments:

```bash
npm run seed
```

## Tests before you change behaviour

```bash
npm test
```

Existing tests lock the current booking rules. Keep them green if you change behaviour: extend or add tests, and do not drop coverage of current behaviour without a reason.
