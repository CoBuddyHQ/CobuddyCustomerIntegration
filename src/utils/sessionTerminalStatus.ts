import type { Session } from '../services/api/session.api';

export function isConfirmedTerminalSession(session: Session | null, expectedSessionId?: string): boolean {
  return Boolean(
    session &&
    (!expectedSessionId || session.id === expectedSessionId) &&
    (session.status === 'completed' || session.status === 'cancelled'),
  );
}

export function isSessionForBooking(session: Session | null, expectedBookingId: string): session is Session {
  return Boolean(session && session.bookingId === expectedBookingId);
}

export function isConfirmedCompletedStatus(status?: string): boolean {
  return ['completed', 'ended_early', 'finished'].includes(status?.toLowerCase() ?? '');
}
