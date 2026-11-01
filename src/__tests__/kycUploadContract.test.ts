import apiClient from '../services/api/apiClient';
import { submitKycDocument, submitKycLiveness } from '../services/api/kyc.api';

describe('customer KYC multipart upload contract', () => {
  afterEach(() => jest.restoreAllMocks());

  it('posts both Aadhaar sides to the implemented document route with a longer upload timeout', async () => {
    const post = jest.spyOn(apiClient, 'post').mockResolvedValue({ data: { message: 'saved' } } as any);

    await submitKycDocument({
      documentType: 'AADHAAR',
      documentNumber: 'redacted-test-document',
      legalName: 'Test User',
      frontDocUri: 'file:///tmp/front.jpg',
      backDocUri: 'file:///tmp/back.jpg',
    });

    expect(post).toHaveBeenCalledWith('/kyc/document', expect.any(FormData), { timeout: 60_000 });
  });

  it('posts a local liveness file once to the implemented route', async () => {
    const post = jest.spyOn(apiClient, 'post').mockResolvedValue({ data: { message: 'saved' } } as any);

    await submitKycLiveness('file:///tmp/liveness.mp4');

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/kyc/liveness', expect.any(FormData), { timeout: 60_000 });
  });
});
