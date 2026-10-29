import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import type { EventDetail, User } from "../types";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function EventDetailPage({ user }: { user: User }) {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busySession, setBusySession] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    api
      .getEvent(id)
      .then(setEvent)
      .catch((err: Error) => setError(err.message));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function book(sessionId: string) {
    setBusySession(sessionId);
    setError(null);
    setMessage(null);
    try {
      // Individual seat only.
      // TODO(challenge): collect party size / waitlist preference here.
      await api.createBooking(sessionId, user.id);
      setMessage("Booking confirmed.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBusySession(null);
    }
  }

  if (!event && !error) return <p className="muted">Loading event…</p>;
  if (!event) return <p className="banner error">{error}</p>;

  return (
    <section className="page">
      <p className="crumb">
        <Link to="/">Events</Link> / {event.title}
      </p>
      <h1>{event.title}</h1>
      <p className="lede">{event.description}</p>
      <p className="meta">Venue: {event.venue}</p>

      {message && <p className="banner ok">{message}</p>}
      {error && <p className="banner error">{error}</p>}

      <h2 className="section-title">Sessions</h2>
      <ul className="session-list">
        {event.sessions.map((session) => {
          const full = session.remainingCapacity <= 0;
          return (
            <li key={session.id} className="session-row">
              <div>
                <p className="when">
                  {formatWhen(session.startsAt)} –{" "}
                  {formatWhen(session.endsAt)}
                </p>
                <p className="capacity">
                  {session.remainingCapacity} of {session.capacity} places
                  remaining
                  {full ? " · full" : ""}
                </p>
              </div>
              <button
                className="btn"
                disabled={full || busySession === session.id}
                onClick={() => book(session.id)}
              >
                {full
                  ? "Full"
                  : busySession === session.id
                    ? "Booking…"
                    : "Book place"}
              </button>
              {/* TODO(challenge): when full, offer "Join waitlist" instead of disabled Full. */}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
