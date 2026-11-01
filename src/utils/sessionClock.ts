export interface SessionClockSource {
  startedAt?: string | null;
  durationMinutes?: number | string | null;
  extensionMinutes?: number | null;
}

export interface SessionClock {
  startedAtMs: number;
  durationSeconds: number;
}

/** Derive timing only from persisted session fields; absent values stay unavailable. */
export function resolveSessionClock(session: SessionClockSource | null | undefined): SessionClock | null {
  if (!session?.startedAt || session.durationMinutes === undefined || session.durationMinutes === null) {
    return null;
  }

  const startedAtMs = new Date(session.startedAt).getTime();
  const durationMinutes = Number(session.durationMinutes);
  const extensionMinutes = session.extensionMinutes === undefined || session.extensionMinutes === null
    ? 0
    : Number(session.extensionMinutes);

  if (!Number.isFinite(startedAtMs) || !Number.isFinite(durationMinutes) || durationMinutes <= 0 ||
      !Number.isFinite(extensionMinutes) || extensionMinutes < 0) {
    return null;
  }

  return {
    startedAtMs,
    durationSeconds: (durationMinutes + extensionMinutes) * 60,
  };
}
