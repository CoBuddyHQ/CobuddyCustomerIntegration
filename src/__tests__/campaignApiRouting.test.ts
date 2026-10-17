jest.mock('../services/api/apiClient', () => ({
  customerApiClient: { get: jest.fn() },
}));

import { customerApiClient } from '../services/api/apiClient';
import { getCampaigns } from '../services/api/discovery.api';

describe('customer campaign API routing', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requests campaigns through the authenticated Customer Backend client', async () => {
    (customerApiClient.get as jest.Mock).mockResolvedValue({
      data: { success: true, campaigns: [{ id: 'campaign-1', title: 'Published offer', message: 'Details' }] },
    });
    await expect(getCampaigns()).resolves.toEqual([
      { id: 'campaign-1', title: 'Published offer', message: 'Details' },
    ]);
    expect(customerApiClient.get).toHaveBeenCalledWith('/discovery/campaigns');
  });

  it('propagates Customer Backend failures instead of using another backend', async () => {
    const failure = new Error('Customer Backend unavailable');
    (customerApiClient.get as jest.Mock).mockRejectedValue(failure);
    await expect(getCampaigns()).rejects.toBe(failure);
    expect(customerApiClient.get).toHaveBeenCalledTimes(1);
  });
});
