export interface User {
  id: string;
  name: string;
  email: string;
}

export interface EventSummary {
  id: string;
  title: string;
  description: string;
  venue: string;
}

export interface SessionWithCapacity {
  id: string;
  eventId: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  bookedCount: number;
  remainingCapacity: number;
}

export interface EventDetail extends EventSummary {
  sessions: SessionWithCapacity[];
}

export interface BookingView {
  id: string;
  sessionId: string;
  userId: string;
  status: "confirmed" | "cancelled";
  createdAt: string;
  eventTitle: string;
  sessionStartsAt: string;
  sessionEndsAt: string;
  venue: string;
  userName: string;
}
