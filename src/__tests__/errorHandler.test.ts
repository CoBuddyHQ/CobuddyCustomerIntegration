import { AxiosError } from 'axios';
import { normalizeError } from '../utils/errorHandler';

describe('normalizeError', () => {
  it('maps a 503 response to a safe retry message', () => {
    const error = new AxiosError('Request failed', 'ERR_BAD_RESPONSE');
    error.response = {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {},
      config: { headers: {} } as any,
      data: { message: 'Internal server error' },
    };

    const normalized = normalizeError(error);

    expect(normalized.statusCode).toBe(503);
    expect(normalized.code).toBe('SERVER_ERROR');
    expect(normalized.message).toBe('Something went wrong on our end. Please try again in a few moments.');
    expect(normalized.isRetryable).toBe(true);
    expect(normalized.message).not.toContain('Internal server error');
  });

  it('keeps non-server validation messages usable', () => {
    const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST');
    error.response = {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: {} } as any,
      data: { message: 'Invalid phone number format' },
    };

    expect(normalizeError(error).message).toBe('Invalid phone number format');
  });
});
