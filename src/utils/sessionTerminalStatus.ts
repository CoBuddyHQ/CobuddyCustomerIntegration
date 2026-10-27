import type { Session } from '../services/api/session.api';

export function isConfirmedTerminalSession(session: Session | null, expectedSessionId?: string): boolean {
  return Boolean(
    session &&
    (!expectedSessionId || session.id === expectedSessionId) &&
    (session.status === 'completed' || session.status === 'cancelled'),
  );
}
