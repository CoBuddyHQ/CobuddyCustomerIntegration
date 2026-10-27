import { isConfirmedTerminalSession } from '../utils/sessionTerminalStatus';
import type { Session } from '../services/api/session.api';

const session = (status: Session['status'], id = 'session-1'): Session => ({
  id, bookingId: 'booking-1', companionId: 'companion-1', customerId: 'customer-1', status,
});

describe('confirmed customer session termination', () => {
  it.each(['completed', 'cancelled'] as const)('accepts an explicit %s state for the requested session', status => {
    expect(isConfirmedTerminalSession(session(status), 'session-1')).toBe(true);
  });
  it('does not treat a missing read as completion', () => expect(isConfirmedTerminalSession(null, 'session-1')).toBe(false));
  it('does not treat a different current session as completion', () => expect(isConfirmedTerminalSession(session('active', 'other'), 'session-1')).toBe(false));
  it('does not treat an ongoing session as completion', () => expect(isConfirmedTerminalSession(session('active'), 'session-1')).toBe(false));
});
