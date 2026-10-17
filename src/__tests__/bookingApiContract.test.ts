jest.mock('../services/api/apiClient', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

import apiClient from '../services/api/apiClient';
import { createBooking } from '../services/api/booking.api';

describe('booking API contract', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends the scheduled timestamp and explicit safety acknowledgment to the Customer Backend', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: 'booking-1' } });
    const scheduledStart = new Date(2026, 9, 20, 19, 0, 0).toISOString();

    await createBooking({
      companionId: 'companion-1',
      activityId: 'INT-1',
      activityName: 'Coffee Meetup',
      venueName: 'Customer selected venue',
      date: '2026-10-20T00:00:00.000Z',
      time: '7:00 PM',
      durationHours: 1,
      safetyAcknowledged: true,
    });

    expect(apiClient.post).toHaveBeenCalledWith('/bookings', expect.objectContaining({
      scheduledStart,
      timeZone: expect.any(String),
      durationHours: 1,
      safetyAcknowledged: true,
    }));
    expect(JSON.stringify((apiClient.post as jest.Mock).mock.calls[0][1])).not.toContain('baseRate');
  });

  it('does not dispatch a booking without explicit safety consent', async () => {
    await expect(createBooking({
      companionId: 'companion-1',
      activityId: 'INT-1',
      activityName: 'Coffee Meetup',
      venueName: 'Customer selected venue',
      date: '2026-10-20T00:00:00.000Z',
      time: '7:00 PM',
      durationHours: 1,
      safetyAcknowledged: false,
    })).rejects.toThrow('Safety agreement must be acknowledged');
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('rejects malformed booking dates and times before making a request', async () => {
    await expect(createBooking({
      companionId: 'companion-1',
      activityId: 'INT-1',
      activityName: 'Coffee Meetup',
      venueName: 'Customer selected venue',
      date: 'not-a-date',
      time: 'later',
      durationHours: 1,
      safetyAcknowledged: true,
    })).rejects.toThrow('supported date and time format');
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
