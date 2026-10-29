import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type { BookingView, User } from "../types";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function MyBookingsPage({ user }: { user: User }) {
  const [bookings, setBookings] = useState<BookingView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .listBookings(user.id)
      .then(setBookings)
      .catch((err: Error) => setError(err.message));
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function cancel(bookingId: string) {
    setBusyId(bookingId);
    setError(null);
    setMessage(null);
    try {
      // TODO(challenge): after cancel, waitlist promotion may free/allocate places.
      await api.cancelBooking(bookingId);
      setMessage("Booking cancelled.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="page">
      <h1>My bookings</h1>
      <p className="lede">
        Bookings for <strong>{user.name}</strong> ({user.email}).
      </p>

      {message && <p className="banner ok">{message}</p>}
      {error && <p className="banner error">{error}</p>}

      {bookings.length === 0 ? (
        <p className="muted">No bookings yet.</p>
      ) : (
        <ul className="booking-list">
          {bookings.map((booking) => (
            <li key={booking.id} className="booking-row">
              <div>
                <h2>{booking.eventTitle}</h2>
                <p className="when">
                  {formatWhen(booking.sessionStartsAt)} –{" "}
                  {formatWhen(booking.sessionEndsAt)}
                </p>
                <p className="meta">
                  {booking.venue} ·{" "}
                  <span className={`status status-${booking.status}`}>
                    {booking.status}
                  </span>
                </p>
              </div>
              {booking.status === "confirmed" && (
                <button
                  className="btn btn-secondary"
                  disabled={busyId === booking.id}
                  onClick={() => cancel(booking.id)}
                >
                  {busyId === booking.id ? "Cancelling…" : "Cancel"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
