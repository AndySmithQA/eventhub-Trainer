import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { EventSummary } from "../types";

export function EventsPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .listEvents()
      .then(setEvents)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">Loading events…</p>;
  if (error) return <p className="banner error">{error}</p>;

  return (
    <section className="page">
      <h1>Upcoming events</h1>
      <p className="lede">
        Browse sessions, check remaining capacity, and book an individual place.
      </p>
      <ul className="event-list">
        {events.map((event, index) => (
          <li
            key={event.id}
            className="event-row"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div>
              <h2>
                <Link to={`/events/${event.id}`}>{event.title}</Link>
              </h2>
              <p>{event.description}</p>
              <p className="meta">{event.venue}</p>
            </div>
            <Link className="btn" to={`/events/${event.id}`}>
              View sessions
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
