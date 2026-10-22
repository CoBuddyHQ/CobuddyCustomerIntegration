import apiClient from '../services/api/apiClient';
import { checkIn, endSession, extendSession, submitFeedback } from '../services/api/session.api';

jest.mock('../services/api/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('Customer session API contract', () => {
  beforeEach(() => jest.clearAllMocks());

  it('checks in through the Customer Backend using the booking identifier only', async () => {
    const session = { id: 'customer-session-1', bookingId: 'booking-1', status: 'checked_in', passCode: 'test-pass-code' };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: session });

    await expect(checkIn('booking-1')).resolves.toEqual(session);
    expect(apiClient.post).toHaveBeenCalledWith('/sessions/check-in', { bookingId: 'booking-1' });
  });

  it('uses the server-confirmed end response', async () => {
    const session = { id: 'customer-session-1', status: 'completed' };
    (apiClient.patch as jest.Mock).mockResolvedValue({ data: session });

    await expect(endSession('customer-session-1')).resolves.toEqual(session);
    expect(apiClient.patch).toHaveBeenCalledWith('/sessions/customer-session-1/end', { tip: undefined });
  });

  it('keeps extension updates behind the Customer Backend endpoint', async () => {
    const error = new Error('Service unavailable');
    (apiClient.patch as jest.Mock).mockRejectedValue(error);

    await expect(extendSession('customer-session-1', 30)).rejects.toBe(error);
    expect(apiClient.patch).toHaveBeenCalledWith('/sessions/customer-session-1/extend', { extraMinutes: 30 });
  });

  it('sends selected feedback to the Customer Backend for the completed session', async () => {
    const result = { message: 'Feedback submitted successfully' };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: result });

    await expect(submitFeedback('customer-session-1', 'up', ['Punctual'])).resolves.toEqual(result);
    expect(apiClient.post).toHaveBeenCalledWith('/sessions/customer-session-1/feedback', {
      sentiment: 'up',
      tags: ['Punctual'],
    });
  });
});
