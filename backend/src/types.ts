/** Domain types for EventHub individual booking. */

export type BookingStatus = "confirmed" | "cancelled";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  venue: string;
}

export interface Session {
  id: string;
  eventId: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
}

export interface Booking {
  id: string;
  sessionId: string;
  userId: string;
  status: BookingStatus;
  createdAt: string;
}

export interface SessionWithCapacity extends Session {
  bookedCount: number;
  remainingCapacity: number;
}

export interface EventDetail extends Event {
  sessions: SessionWithCapacity[];
}

export interface BookingView extends Booking {
  eventTitle: string;
  sessionStartsAt: string;
  sessionEndsAt: string;
  venue: string;
  userName: string;
}
