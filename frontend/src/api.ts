import type {
  BookingView,
  EventDetail,
  EventSummary,
  User,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof body.error === "string" ? body.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body as T;
}

export const api = {
  listUsers: () => request<User[]>("/api/users"),
  listEvents: () => request<EventSummary[]>("/api/events"),
  getEvent: (id: string) => request<EventDetail>(`/api/events/${id}`),
  listBookings: (userId: string) =>
    request<BookingView[]>(`/api/users/${userId}/bookings`),
  createBooking: (sessionId: string, userId: string) =>
    request<{ id: string }>("/api/bookings", {
      method: "POST",
      body: JSON.stringify({ sessionId, userId }),
    }),
  cancelBooking: (bookingId: string) =>
    request<{ id: string; status: string }>(`/api/bookings/${bookingId}`, {
      method: "DELETE",
    }),
};
