import { customerApiClient } from '../services/api/apiClient';
import { getActivities, getCompanions } from '../services/api/discovery.api';

jest.mock('../services/api/apiClient', () => ({
  customerApiClient: { get: jest.fn() },
}));

describe('Customer discovery companion API contract', () => {
  beforeEach(() => jest.clearAllMocks());

  it('accepts a paginated Companion service response with no published profiles', async () => {
    (customerApiClient.get as jest.Mock).mockResolvedValue({ data: {
      companions: [], total: 0, page: 1, limit: 20, totalPages: 0,
    } });

    await expect(getCompanions()).resolves.toEqual({
      companions: [], data: [], total: 0, page: 1, limit: 20, totalPages: 0,
    });
  });

  it('unwraps the service envelope and preserves server pagination', async () => {
    const companion = { id: 'published-1', name: 'Published companion' };
    (customerApiClient.get as jest.Mock).mockResolvedValue({ data: {
      success: true,
      data: { companions: [companion], total: 31, page: 2, limit: 20, totalPages: 2 },
    } });

    await expect(getCompanions({ page: 2 })).resolves.toMatchObject({
      companions: [companion], data: [companion], total: 31, page: 2, limit: 20, totalPages: 2,
    });
    expect(customerApiClient.get).toHaveBeenCalledWith('/discovery/companions', { params: { page: 2 } });
  });

  it('treats a malformed companion payload as a failure rather than a false empty state', async () => {
    (customerApiClient.get as jest.Mock).mockResolvedValue({ data: { companions: { id: 'not-a-list' } } });
    await expect(getCompanions()).rejects.toThrow('invalid companion list');
  });

  it('loads activities only from the Customer Backend contract', async () => {
    const activities = [{ id: 'a1', defaultTitle: 'Coffee Meetup', price: 'INR 500/hr' }];
    (customerApiClient.get as jest.Mock).mockResolvedValue({ data: activities });

    await expect(getActivities()).resolves.toEqual(activities);
    expect(customerApiClient.get).toHaveBeenCalledWith('/discovery/activities');
  });

  it('rejects malformed activity responses instead of allowing fallback choices', async () => {
    (customerApiClient.get as jest.Mock).mockResolvedValue({ data: [{ id: 'a1' }] });
    await expect(getActivities()).rejects.toThrow('invalid activity at index 0');
  });

  it('accepts an empty activity list as a real empty state', async () => {
    (customerApiClient.get as jest.Mock).mockResolvedValue({ data: [] });
    await expect(getActivities()).resolves.toEqual([]);
  });
});
