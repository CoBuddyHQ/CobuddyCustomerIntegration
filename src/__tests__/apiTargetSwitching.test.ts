/**
 * CoBuddy Customer Mobile App — Dual Backend Target Switching Unit Tests
 *
 * Verifies:
 * 1. Independent matrix resolution for Customer and Campaign APIs (all 4 combinations)
 * 2. Strict boolean parsing (never treats string "false" as truthy)
 * 3. Configuration error enforcement on missing/invalid URLs (no silent fallback)
 * 4. Android platform loopback translation ('localhost' -> '10.0.2.2')
 * 5. Production HTTPS protocol requirement for Azure endpoints
 * 6. Authentication header isolation (Customer client gets token; Campaign client remains isolated)
 * 7. Error propagation without automatic alternative environment failover
 */

import {
  parseBooleanFlag,
  resolveUrlForPlatform,
  resolveServiceUrl,
  createApiConfig,
  getApiConfigDiagnostics,
} from '../config/env';

describe('1. Strict Boolean Flag Parser', () => {
  it('correctly identifies truthy values', () => {
    expect(parseBooleanFlag('true')).toBe(true);
    expect(parseBooleanFlag('TRUE')).toBe(true);
    expect(parseBooleanFlag('  true  ')).toBe(true);
    expect(parseBooleanFlag('1')).toBe(true);
    expect(parseBooleanFlag(1)).toBe(true);
    expect(parseBooleanFlag(true)).toBe(true);
  });

  it('CRITICAL: never treats string "false" or "0" as truthy', () => {
    expect(parseBooleanFlag('false')).toBe(false);
    expect(parseBooleanFlag('FALSE')).toBe(false);
    expect(parseBooleanFlag('  false  ')).toBe(false);
    expect(parseBooleanFlag('0')).toBe(false);
    expect(parseBooleanFlag(0)).toBe(false);
    expect(parseBooleanFlag(false)).toBe(false);
  });

  it('falls back to default value on undefined or empty input', () => {
    expect(parseBooleanFlag(undefined, false)).toBe(false);
    expect(parseBooleanFlag('', false)).toBe(false);
    expect(parseBooleanFlag(null, true)).toBe(true);
    expect(parseBooleanFlag('random_string', false)).toBe(false);
  });
});

describe('2. Platform URL Resolution', () => {
  it('translates localhost to 10.0.2.2 on Android', () => {
    const raw = 'http://localhost:4002/api/v1';
    expect(resolveUrlForPlatform(raw, 'android')).toBe('http://10.0.2.2:4002/api/v1');
  });

  it('translates 127.0.0.1 to 10.0.2.2 on Android', () => {
    const raw = 'http://127.0.0.1:4001/api/v1';
    expect(resolveUrlForPlatform(raw, 'android')).toBe('http://10.0.2.2:4001/api/v1');
  });

  it('preserves localhost on iOS and other platforms', () => {
    const raw = 'http://localhost:4002/api/v1';
    expect(resolveUrlForPlatform(raw, 'ios')).toBe('http://localhost:4002/api/v1');
    expect(resolveUrlForPlatform(raw, 'windows')).toBe('http://localhost:4002/api/v1');
  });

  it('preserves remote cloud URLs unmodified on all platforms', () => {
    const azureUrl = 'https://cobuddy-customer-api-avinash-gshhhhfbdrf2dab4.indiasouthcentral-01.azurewebsites.net/api/v1';
    expect(resolveUrlForPlatform(azureUrl, 'android')).toBe(azureUrl);
    expect(resolveUrlForPlatform(azureUrl, 'ios')).toBe(azureUrl);
  });
});

describe('3. Independent Dual-API Resolution Matrix (All 4 Combinations)', () => {
  const baseMockEnv = {
    AZURE_CUSTOMER_API_URL: 'https://cobuddy-customer-api-avinash-gshhhhfbdrf2dab4.indiasouthcentral-01.azurewebsites.net/api/v1',
    LOCAL_CUSTOMER_API_URL: 'http://localhost:4002/api/v1',
    AZURE_CAMPAIGN_API_URL: 'https://cobuddy-companion-api-avinash-huhdawdkgjhedsgy.indiasouthcentral-01.azurewebsites.net/api/v1',
    LOCAL_CAMPAIGN_API_URL: 'http://localhost:4001/api/v1',
  };

  it('Combination 1 [false, false]: Local Customer + Local Campaign', () => {
    const config = createApiConfig({
      ...baseMockEnv,
      USE_AZURE_CUSTOMER_API: 'false',
      USE_AZURE_CAMPAIGN_API: 'false',
    }, 'android');

    expect(config.customer.useAzure).toBe(false);
    expect(config.customer.targetMode).toBe('LOCAL');
    expect(config.customer.resolvedBaseUrl).toBe('http://10.0.2.2:4002/api/v1');

    expect(config.campaign.useAzure).toBe(false);
    expect(config.campaign.targetMode).toBe('LOCAL');
    expect(config.campaign.resolvedBaseUrl).toBe('http://10.0.2.2:4001/api/v1');

    const diag = getApiConfigDiagnostics(config);
    expect(diag.matrixMode).toBe('Customer: LOCAL | Campaign: LOCAL');
  });

  it('Combination 2 [true, true]: Azure Customer + Azure Campaign', () => {
    const config = createApiConfig({
      ...baseMockEnv,
      USE_AZURE_CUSTOMER_API: 'true',
      USE_AZURE_CAMPAIGN_API: 'true',
    }, 'android');

    expect(config.customer.useAzure).toBe(true);
    expect(config.customer.targetMode).toBe('AZURE');
    expect(config.customer.resolvedBaseUrl).toBe(baseMockEnv.AZURE_CUSTOMER_API_URL);

    expect(config.campaign.useAzure).toBe(true);
    expect(config.campaign.targetMode).toBe('AZURE');
    expect(config.campaign.resolvedBaseUrl).toBe(baseMockEnv.AZURE_CAMPAIGN_API_URL);

    const diag = getApiConfigDiagnostics(config);
    expect(diag.matrixMode).toBe('Customer: AZURE | Campaign: AZURE');
  });

  it('Combination 3 [true, false]: Azure Customer + Local Campaign', () => {
    const config = createApiConfig({
      ...baseMockEnv,
      USE_AZURE_CUSTOMER_API: 'true',
      USE_AZURE_CAMPAIGN_API: 'false',
    }, 'android');

    expect(config.customer.useAzure).toBe(true);
    expect(config.customer.targetMode).toBe('AZURE');
    expect(config.customer.resolvedBaseUrl).toBe(baseMockEnv.AZURE_CUSTOMER_API_URL);

    expect(config.campaign.useAzure).toBe(false);
    expect(config.campaign.targetMode).toBe('LOCAL');
    expect(config.campaign.resolvedBaseUrl).toBe('http://10.0.2.2:4001/api/v1');

    const diag = getApiConfigDiagnostics(config);
    expect(diag.matrixMode).toBe('Customer: AZURE | Campaign: LOCAL');
  });

  it('Combination 4 [false, true]: Local Customer + Azure Campaign', () => {
    const config = createApiConfig({
      ...baseMockEnv,
      USE_AZURE_CUSTOMER_API: 'false',
      USE_AZURE_CAMPAIGN_API: 'true',
    }, 'android');

    expect(config.customer.useAzure).toBe(false);
    expect(config.customer.targetMode).toBe('LOCAL');
    expect(config.customer.resolvedBaseUrl).toBe('http://10.0.2.2:4002/api/v1');

    expect(config.campaign.useAzure).toBe(true);
    expect(config.campaign.targetMode).toBe('AZURE');
    expect(config.campaign.resolvedBaseUrl).toBe(baseMockEnv.AZURE_CAMPAIGN_API_URL);

    const diag = getApiConfigDiagnostics(config);
    expect(diag.matrixMode).toBe('Customer: LOCAL | Campaign: AZURE');
  });

  it('changing Customer flag does NOT alter Campaign target', () => {
    const config1 = createApiConfig({
      ...baseMockEnv,
      USE_AZURE_CUSTOMER_API: 'false',
      USE_AZURE_CAMPAIGN_API: 'false',
    }, 'android');

    const config2 = createApiConfig({
      ...baseMockEnv,
      USE_AZURE_CUSTOMER_API: 'true',
      USE_AZURE_CAMPAIGN_API: 'false',
    }, 'android');

    expect(config1.campaign.resolvedBaseUrl).toBe(config2.campaign.resolvedBaseUrl);
    expect(config1.campaign.targetMode).toBe(config2.campaign.targetMode);
    expect(config1.customer.targetMode).not.toBe(config2.customer.targetMode);
  });
});

describe('4. Configuration Error & Fallback Prevention Rules', () => {
  it('throws ConfigurationError if Azure mode is true but Azure URL is empty (no silent fallback to local)', () => {
    expect(() => {
      resolveServiceUrl(
        'Customer',
        true, // useAzure
        '',   // missing azureUrl
        'http://localhost:4002/api/v1',
        'android'
      );
    }).toThrow('[ConfigurationError] USE_AZURE_CUSTOMER_API is \'true\', but AZURE_CUSTOMER_API_URL is missing or empty.');
  });

  it('throws ConfigurationError if Local mode is false but Local URL is empty (no silent fallback to azure)', () => {
    expect(() => {
      resolveServiceUrl(
        'Campaign',
        false, // useLocal
        'https://azure-host/api/v1',
        '',    // missing localUrl
        'android'
      );
    }).toThrow('[ConfigurationError] USE_AZURE_CAMPAIGN_API is \'false\', but LOCAL_CAMPAIGN_API_URL is missing or empty.');
  });

  it('enforces HTTPS for Azure URLs in production builds', () => {
    expect(() => {
      resolveServiceUrl(
        'Customer',
        true,
        'http://insecure-azure-endpoint.azurewebsites.net/api/v1',
        'http://localhost:4002/api/v1',
        'android',
        true // isProductionBuild
      );
    }).toThrow('[SecurityError] In production builds, AZURE_CUSTOMER_API_URL must use HTTPS protocol');
  });
});

describe('5. Client Separation & Authentication Boundary', () => {
  it('verifies customerApiClient and campaignApiClient are distinct instances', () => {
    const { customerApiClient } = require('../services/api/customerApiClient');
    const { campaignApiClient } = require('../services/api/campaignApiClient');

    expect(customerApiClient).toBeDefined();
    expect(campaignApiClient).toBeDefined();
    expect(customerApiClient).not.toBe(campaignApiClient);
  });

  it('ensures customerApiClient has request interceptors for Authorization token injection', () => {
    const { customerApiClient } = require('../services/api/customerApiClient');
    // Axios interceptor manager has registered handlers
    expect((customerApiClient.interceptors.request as any).handlers.length).toBeGreaterThan(0);
  });

  it('ensures campaignApiClient does not leak customer bearer token to public campaign endpoints', async () => {
    const { campaignApiClient } = require('../services/api/campaignApiClient');
    const dummyConfig: any = { headers: {} };
    const requestHandler = (campaignApiClient.interceptors.request as any).handlers[0]?.fulfilled;
    if (requestHandler) {
      const result = await requestHandler(dummyConfig);
      expect(result.headers.Authorization).toBeUndefined();
    }
  });
});

