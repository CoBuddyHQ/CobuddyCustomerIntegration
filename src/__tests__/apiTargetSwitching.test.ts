import {
  createApiConfig,
  getApiConfigDiagnostics,
  parseBooleanFlag,
  resolveServiceUrl,
  resolveUrlForPlatform,
} from '../config/env';

describe('Customer API configuration', () => {
  it('parses boolean flags without treating the string false as true', () => {
    expect(parseBooleanFlag('true')).toBe(true);
    expect(parseBooleanFlag('1')).toBe(true);
    expect(parseBooleanFlag('false')).toBe(false);
    expect(parseBooleanFlag('0')).toBe(false);
    expect(parseBooleanFlag(undefined)).toBe(false);
  });

  it('maps Android emulator loopback to the host bridge', () => {
    expect(resolveUrlForPlatform('http://localhost:4002/api/v1', 'android'))
      .toBe('http://10.0.2.2:4002/api/v1');
    expect(resolveUrlForPlatform('http://127.0.0.1:4002/api/v1', 'android'))
      .toBe('http://10.0.2.2:4002/api/v1');
    expect(resolveUrlForPlatform('http://localhost:4002/api/v1', 'ios'))
      .toBe('http://localhost:4002/api/v1');
  });

  it('resolves the local Customer Backend target and diagnostics', () => {
    const config = createApiConfig({
      APP_ENV: 'development',
      USE_AZURE_CUSTOMER_API: 'false',
      LOCAL_CUSTOMER_API_URL: 'http://localhost:4002/api/v1',
    }, 'android');

    expect(config.customer.resolvedBaseUrl).toBe('http://10.0.2.2:4002/api/v1');
    expect(config.enableLogging).toBe(false);
    expect(getApiConfigDiagnostics(config).matrixMode).toBe('Customer: LOCAL');
    expect('campaign' in config).toBe(false);
  });

  it('uses the explicitly configured remote Customer Backend without a fallback', () => {
    const url = 'https://customer-api.example.test/api/v1';
    const config = createApiConfig({
      APP_ENV: 'production',
      USE_AZURE_CUSTOMER_API: 'true',
      AZURE_CUSTOMER_API_URL: url,
      LOCAL_CUSTOMER_API_URL: 'http://localhost:4002/api/v1',
    }, 'android');

    expect(config.customer.targetMode).toBe('AZURE');
    expect(config.customer.resolvedBaseUrl).toBe(url);
  });

  it('fails if the selected URL is missing', () => {
    expect(() => resolveServiceUrl('Customer', true, '', 'http://localhost:4002/api/v1'))
      .toThrow('AZURE_CUSTOMER_API_URL is missing or empty');
    expect(() => resolveServiceUrl('Customer', false, 'https://customer-api.example.test', '', 'android'))
      .toThrow('LOCAL_CUSTOMER_API_URL is missing or empty');
  });

  it('rejects local mode and non-HTTPS URLs for production builds', () => {
    expect(() => createApiConfig({
      APP_ENV: 'production',
      USE_AZURE_CUSTOMER_API: 'false',
      LOCAL_CUSTOMER_API_URL: 'http://localhost:4002/api/v1',
    }, 'android')).toThrow('Production builds must select the deployed Customer Backend URL');

    expect(() => resolveServiceUrl(
      'Customer',
      true,
      'http://customer-api.example.test/api/v1',
      'http://localhost:4002/api/v1',
      'android',
      true,
    )).toThrow('must use HTTPS protocol');
  });

  it('requires a finite positive request timeout', () => {
    expect(() => createApiConfig({
      APP_ENV: 'development',
      LOCAL_CUSTOMER_API_URL: 'http://localhost:4002/api/v1',
      REQUEST_TIMEOUT_MS: 'invalid',
    }, 'android')).toThrow('REQUEST_TIMEOUT_MS must be a positive number');
  });
});
