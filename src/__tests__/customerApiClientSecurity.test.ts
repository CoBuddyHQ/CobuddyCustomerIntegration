import axios from 'axios';
import { ENV } from '../config/env';
import { customerApiClient, TokenStorage } from '../services/api/customerApiClient';

describe('customerApiClient security behavior', () => {
  const previousDev = (globalThis as any).__DEV__;
  const previousLogging = ENV.enableLogging;

  afterEach(() => {
    jest.restoreAllMocks();
    (globalThis as any).__DEV__ = previousDev;
    ENV.enableLogging = previousLogging;
  });

  it('never logs request or response payloads, even when development logging is enabled', async () => {
    ENV.enableLogging = true;
    (globalThis as any).__DEV__ = true;
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const requestHandler = (customerApiClient.interceptors.request as any).handlers[0].fulfilled;
    const responseHandler = (customerApiClient.interceptors.response as any).handlers[0].fulfilled;
    const requestSecret = 'request-payload-test-value';
    const responseSecret = 'response-payload-test-value';

    await requestHandler({
      method: 'post',
      baseURL: 'https://customer.example.test',
      url: '/auth/verify-otp',
      data: { otp: requestSecret },
      headers: {},
    });
    responseHandler({
      status: 200,
      config: { url: '/auth/verify-otp' },
      data: { token: responseSecret },
    });
    const rejectionHandler = (customerApiClient.interceptors.response as any).handlers[0].rejected;
    const failure = {
      response: { status: 503, data: { token: responseSecret } },
      config: { url: '/notifications' },
    };
    await expect(rejectionHandler(failure)).rejects.toBe(failure);

    expect(JSON.stringify(log.mock.calls)).not.toContain(requestSecret);
    expect(JSON.stringify(log.mock.calls)).not.toContain(responseSecret);
    expect(JSON.stringify(warn.mock.calls)).not.toContain(requestSecret);
    expect(JSON.stringify(warn.mock.calls)).not.toContain(responseSecret);
  });

  it('rejects queued requests when refresh fails instead of leaving them pending', async () => {
    await TokenStorage.setTokens('access-token-for-test', 'refresh-token-for-test');
    let rejectRefresh!: (error: Error) => void;
    const refreshFailure = new Error('refresh unavailable');
    const refreshPromise = new Promise((_resolve, reject) => {
      rejectRefresh = reject;
    });
    jest.spyOn(axios, 'post').mockReturnValue(refreshPromise as any);
    const rejectionHandler = (customerApiClient.interceptors.response as any).handlers[0].rejected;
    const firstError = {
      response: { status: 401 },
      config: { url: '/profile', headers: {} },
    };
    const queuedError = {
      response: { status: 401 },
      config: { url: '/bookings', headers: {} },
    };

    const firstRequest = rejectionHandler(firstError);
    const queuedRequest = rejectionHandler(queuedError);
    rejectRefresh(refreshFailure);

    await expect(firstRequest).rejects.toBe(firstError);
    await expect(queuedRequest).rejects.toBe(refreshFailure);
  });
});
