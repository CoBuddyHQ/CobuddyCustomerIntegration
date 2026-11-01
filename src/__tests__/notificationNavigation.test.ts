import { openNotification, resolveNotificationDestination } from '../services/notificationNavigation';

describe('notification navigation', () => {
  it('opens a booking detail directly from the notification payload', () => {
    expect(resolveNotificationDestination({
      id: 'n1',
      title: 'Booking accepted',
      route: 'BookingDetailScreen',
      routeParams: { bookingId: 'booking-1', status: 'accepted' },
    })).toEqual({ kind: 'booking', bookingId: 'booking-1', status: 'accepted' });
  });

  it('opens the bookings list when a booking notification has no booking ID', () => {
    expect(resolveNotificationDestination({
      id: 'n2',
      title: 'Booking request update',
      category: 'booking',
    })).toEqual({ kind: 'bookings-list' });
  });

  it('opens the active session by session ID when no booking ID is supplied', () => {
    expect(resolveNotificationDestination({
      id: 'n-session',
      title: 'Session started',
      route: 'ActiveSessionScreen',
      data: { sessionId: 'session-1' },
    })).toMatchObject({
      kind: 'nested',
      screen: 'ActiveSessionScreen',
      params: { sessionId: 'session-1' },
    });
  });

  it('falls back to bookings instead of opening an unusable review screen without an ID', () => {
    expect(resolveNotificationDestination({ id: 'n-review', title: 'Please leave a review' }))
      .toEqual({ kind: 'bookings-list' });
  });

  it('does not wait for the read receipt before navigating', () => {
    const markAsRead = jest.fn(() => new Promise<void>(() => undefined));
    const navigate = jest.fn();

    openNotification({ id: 'n3', title: 'Booking accepted' }, markAsRead, navigate);

    expect(markAsRead).toHaveBeenCalledWith('n3');
    expect(navigate).toHaveBeenCalledWith({ kind: 'bookings-list' });
  });

  it('still navigates if persisting the read receipt throws synchronously', () => {
    const markAsRead = jest.fn(() => { throw new Error('offline'); });
    const navigate = jest.fn();

    openNotification({ id: 'n4', title: 'Booking accepted' }, markAsRead, navigate);

    expect(navigate).toHaveBeenCalledWith({ kind: 'bookings-list' });
  });
});
