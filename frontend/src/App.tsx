import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { api } from "./api";
import { EventDetailPage } from "./pages/EventDetailPage";
import { EventsPage } from "./pages/EventsPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import type { User } from "./types";

const USER_KEY = "eventhub.currentUserId";

export function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState(
    () => localStorage.getItem(USER_KEY) ?? ""
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listUsers()
      .then((list) => {
        setUsers(list);
        setUserId((current) => {
          if (current && list.some((u) => u.id === current)) return current;
          const first = list[0]?.id ?? "";
          if (first) localStorage.setItem(USER_KEY, first);
          return first;
        });
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  function onUserChange(id: string) {
    setUserId(id);
    localStorage.setItem(USER_KEY, id);
  }

  const currentUser = users.find((u) => u.id === userId) ?? null;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand-block">
          <Link to="/" className="brand">
            EventHub
          </Link>
          <p className="tagline">Book a place on an event session</p>
        </div>
        <nav className="nav">
          <Link to="/">Events</Link>
          <Link to="/bookings">My bookings</Link>
        </nav>
        <label className="user-switcher">
          <span>Acting as</span>
          <select
            value={userId}
            onChange={(e) => onUserChange(e.target.value)}
            disabled={users.length === 0}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      {error && <p className="banner error">{error}</p>}

      <main className="main">
        <Routes>
          <Route path="/" element={<EventsPage />} />
          <Route
            path="/events/:id"
            element={
              currentUser ? (
                <EventDetailPage user={currentUser} />
              ) : (
                <p className="muted">Loading users…</p>
              )
            }
          />
          <Route
            path="/bookings"
            element={
              currentUser ? (
                <MyBookingsPage user={currentUser} />
              ) : (
                <p className="muted">Loading users…</p>
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="footer">
        <p>
          Individual bookings only.{" "}
          {/* TODO(challenge): group bookings + waitlists — intentionally not built. */}
          Group bookings and waitlists are out of scope for this starter.
        </p>
      </footer>
    </div>
  );
}
