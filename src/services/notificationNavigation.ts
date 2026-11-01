export interface NotificationNavigationInput {
  id: string;
  title?: string;
  category?: string;
  route?: string;
  routeParams?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export type NotificationDestination =
  | { kind: 'nested'; navigator: 'LiveSessionStack' | 'BookingFlowStack'; screen: string; params: Record<string, unknown> }
  | { kind: 'booking'; bookingId: string; status?: string }
  | { kind: 'bookings-list' };

export function resolveNotificationDestination(
  notification: NotificationNavigationInput,
): NotificationDestination {
  const title = (notification.title || '').toLowerCase();
  const params = { ...(notification.data || {}), ...(notification.routeParams || {}) };
  const route = notification.route || '';
  const rawBookingId = params.bookingId || (
    title.includes('booking') || notification.category === 'booking' ? params.id : undefined
  );
  const bookingId = typeof rawBookingId === 'string' && rawBookingId.trim()
    ? rawBookingId.trim()
    : undefined;
  const sessionId = typeof params.sessionId === 'string' && params.sessionId.trim()
    ? params.sessionId.trim()
    : undefined;

  if (title.includes('review') || route === 'SessionFeedbackScreen' || route === 'CompanionReviewScreen') {
    if (!bookingId && !sessionId) return { kind: 'bookings-list' };
    return {
      kind: 'nested',
      navigator: 'LiveSessionStack',
      screen: 'CompanionReviewScreen',
      params: { ...params, ...(bookingId ? { bookingId } : {}), ...(sessionId ? { sessionId } : {}) },
    };
  }

  if (title.includes('started') || (route === 'ActiveSessionScreen' && !title.includes('accepted'))) {
    if (!bookingId && !sessionId) return { kind: 'bookings-list' };
    return {
      kind: 'nested',
      navigator: 'LiveSessionStack',
      screen: 'ActiveSessionScreen',
      params: { ...params, ...(bookingId ? { bookingId } : {}), ...(sessionId ? { sessionId } : {}) },
    };
  }

  if (title.includes('counter') || route === 'BookingCounterOfferScreen') {
    if (!bookingId) return { kind: 'bookings-list' };
    return {
      kind: 'nested',
      navigator: 'BookingFlowStack',
      screen: 'BookingCounterOfferScreen',
      params: { ...params, ...(bookingId ? { bookingId } : {}) },
    };
  }

  if (bookingId) {
    return {
      kind: 'booking',
      bookingId,
      status: typeof params.status === 'string' ? params.status : undefined,
    };
  }

  return { kind: 'bookings-list' };
}

/** Mark a notification read without allowing a slow API call to block navigation. */
export function openNotification(
  notification: NotificationNavigationInput,
  markAsRead: (id: string) => Promise<unknown>,
  navigate: (destination: NotificationDestination) => void,
): void {
  try {
    markAsRead(notification.id).catch(() => undefined);
  } catch {
    // Navigation must continue even if a client implementation throws synchronously.
  }
  navigate(resolveNotificationDestination(notification));
}
