import { resolveSessionClock } from '../utils/sessionClock';

describe('resolveSessionClock', () => {
  it('uses persisted start, duration, and extension values', () => {
    expect(resolveSessionClock({
      startedAt: '2026-11-01T10:00:00.000Z',
      durationMinutes: 90,
      extensionMinutes: 15,
    })).toEqual({
      startedAtMs: Date.parse('2026-11-01T10:00:00.000Z'),
      durationSeconds: 6300,
    });
  });

  it.each([
    [null, 60],
    ['2026-11-01T10:00:00.000Z', null],
    ['not-a-timestamp', 60],
    ['2026-11-01T10:00:00.000Z', 0],
    ['2026-11-01T10:00:00.000Z', 'invalid'],
  ])('does not invent a clock when session timing is incomplete (%s, %s)', (startedAt, durationMinutes) => {
    expect(resolveSessionClock({ startedAt, durationMinutes } as any)).toBeNull();
  });
});
