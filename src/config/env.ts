/**
 * CoBuddy Customer — Centralized Customer API Configuration
 *
 * The app talks to the Customer Backend. Cross-service campaign reads are
 * mediated by that backend and never target a second app-configured API.
 *
 * Rules:
 * - True selects configured Azure URL; False selects configured Local Docker URL.
 * - Local failure NEVER silently falls back to a deployed URL, or vice-versa.
 * - Android emulator auto-resolves 'localhost'/'127.0.0.1' -> '10.0.2.2'.
 * - Production builds validate Azure endpoints use HTTPS.
 */

import { Platform } from 'react-native';

declare const process: { env?: Record<string, string | undefined> } | undefined;

import {
  USE_AZURE_CUSTOMER_API as envUseAzureCustomer,
  AZURE_CUSTOMER_API_URL as envAzureCustomerUrl,
  LOCAL_CUSTOMER_API_URL as envLocalCustomerUrl,
  APP_ENV as envAppEnv,
  ENABLE_LOGGING as envEnableLogging,
  DEFAULT_LANGUAGE as envDefaultLanguage,
  REQUEST_TIMEOUT_MS as envRequestTimeout,
  GOOGLE_MAPS_API_KEY as envMapsKey,
  RAZORPAY_KEY_ID as envRazorpayKey,
} from '@env';

export const getRuntimeEnv = (): Record<string, string | undefined> => {
  return {
    USE_AZURE_CUSTOMER_API: envUseAzureCustomer ?? (typeof process !== 'undefined' ? process.env?.USE_AZURE_CUSTOMER_API : undefined),
    AZURE_CUSTOMER_API_URL: envAzureCustomerUrl ?? (typeof process !== 'undefined' ? process.env?.AZURE_CUSTOMER_API_URL : undefined),
    LOCAL_CUSTOMER_API_URL: envLocalCustomerUrl ?? (typeof process !== 'undefined' ? process.env?.LOCAL_CUSTOMER_API_URL : undefined),
    APP_ENV: envAppEnv ?? (typeof process !== 'undefined' ? process.env?.APP_ENV : undefined),
    ENABLE_LOGGING: envEnableLogging ?? (typeof process !== 'undefined' ? process.env?.ENABLE_LOGGING : undefined),
    DEFAULT_LANGUAGE: envDefaultLanguage ?? (typeof process !== 'undefined' ? process.env?.DEFAULT_LANGUAGE : undefined),
    REQUEST_TIMEOUT_MS: envRequestTimeout ?? (typeof process !== 'undefined' ? process.env?.REQUEST_TIMEOUT_MS : undefined),
    GOOGLE_MAPS_API_KEY: envMapsKey ?? (typeof process !== 'undefined' ? process.env?.GOOGLE_MAPS_API_KEY : undefined),
    RAZORPAY_KEY_ID: envRazorpayKey ?? (typeof process !== 'undefined' ? process.env?.RAZORPAY_KEY_ID : undefined),
  };
};


/**
 * Strict boolean flag parser:
 * - Treats 'true', '1', true as true
 * - Treats 'false', '0', false, undefined, '' as false
 * - CRITICAL: Never treats string 'false' as truthy.
 */
export function parseBooleanFlag(val: unknown, defaultVal = false): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const trimmed = val.trim().toLowerCase();
    if (trimmed === 'true' || trimmed === '1') return true;
    if (trimmed === 'false' || trimmed === '0') return false;
  }
  return defaultVal;
}

/**
 * Runtime host resolution for Android emulators & devices
 */
export function resolveUrlForPlatform(rawUrl: string, platformOs: string = Platform.OS): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (platformOs === 'android') {
    if (trimmed.includes('localhost')) {
      return trimmed.replace('localhost', '10.0.2.2');
    }
    if (trimmed.includes('127.0.0.1')) {
      return trimmed.replace('127.0.0.1', '10.0.2.2');
    }
  }
  return trimmed;
}

export interface ServiceTargetConfig {
  useAzure: boolean;
  azureUrl: string;
  localUrl: string;
  resolvedBaseUrl: string;
  targetMode: 'AZURE' | 'LOCAL';
}

export interface CustomerApiConfig {
  customer: ServiceTargetConfig;
  appEnv: string;
  isDev: boolean;
  enableLogging: boolean;
  defaultLanguage: string;
  requestTimeoutMs: number;
  googleMapsApiKey: string;
  razorpayKeyId: string;
}

/**
 * Validates and resolves the URL for a specific backend service.
 * Throws an explicit error if the selected target URL is missing or invalid.
 */
export function resolveServiceUrl(
  serviceName: 'Customer',
  useAzure: boolean,
  azureUrlRaw?: string,
  localUrlRaw?: string,
  platformOs: string = Platform.OS,
  isProductionBuild = false
): ServiceTargetConfig {
  const azureUrl = (azureUrlRaw || '').trim();
  const localUrl = (localUrlRaw || '').trim();

  if (useAzure) {
    if (!azureUrl) {
      throw new Error(
        `[ConfigurationError] USE_AZURE_${serviceName.toUpperCase()}_API is 'true', but AZURE_${serviceName.toUpperCase()}_API_URL is missing or empty.`
      );
    }
    if (isProductionBuild && !isHttpsUrl(azureUrl)) {
      throw new Error(
        `[SecurityError] In production builds, AZURE_${serviceName.toUpperCase()}_API_URL must use HTTPS protocol: ${azureUrl}`
      );
    }
    return {
      useAzure: true,
      azureUrl,
      localUrl,
      resolvedBaseUrl: azureUrl.replace(/\/+$/, ''),
      targetMode: 'AZURE',
    };
  } else {
    if (!localUrl) {
      throw new Error(
        `[ConfigurationError] USE_AZURE_${serviceName.toUpperCase()}_API is 'false', but LOCAL_${serviceName.toUpperCase()}_API_URL is missing or empty.`
      );
    }
    const resolvedLocal = resolveUrlForPlatform(localUrl, platformOs);
    if (isProductionBuild && !isHttpsUrl(resolvedLocal)) {
      throw new Error(
        `[SecurityError] In production builds, the selected ${serviceName.toLowerCase()} API URL must use HTTPS.`
      );
    }
    return {
      useAzure: false,
      azureUrl,
      localUrl,
      resolvedBaseUrl: resolvedLocal.replace(/\/+$/, ''),
      targetMode: 'LOCAL',
    };
  }
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

/**
 * Factory for creating verified configuration from an arbitrary env object.
 */
export function createApiConfig(
  source: Record<string, string | undefined> = getRuntimeEnv(),
  platformOs: string = Platform.OS
): CustomerApiConfig {
  const appEnv = (source.APP_ENV || 'development').trim().toLowerCase();
  if (!['development', 'test', 'staging', 'production'].includes(appEnv)) {
    throw new Error('[ConfigurationError] APP_ENV must be development, test, staging, or production.');
  }
  const isProductionBuild = appEnv === 'production' || appEnv === 'staging';
  const isDev = !isProductionBuild;

  const useAzureCustomer = parseBooleanFlag(source.USE_AZURE_CUSTOMER_API, false);
  if (isProductionBuild && !useAzureCustomer) {
    throw new Error('[SecurityError] Production builds must select the deployed Customer Backend URL.');
  }
  const customer = resolveServiceUrl(
    'Customer',
    useAzureCustomer,
    source.AZURE_CUSTOMER_API_URL,
    source.LOCAL_CUSTOMER_API_URL,
    platformOs,
    isProductionBuild
  );

  const requestTimeoutMs = Number(source.REQUEST_TIMEOUT_MS || '15000');
  if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs <= 0) {
    throw new Error('[ConfigurationError] REQUEST_TIMEOUT_MS must be a positive number.');
  }

  return {
    customer,
    appEnv,
    isDev,
    enableLogging: parseBooleanFlag(source.ENABLE_LOGGING, false),
    defaultLanguage: source.DEFAULT_LANGUAGE || 'en',
    requestTimeoutMs,
    googleMapsApiKey: source.GOOGLE_MAPS_API_KEY || '',
    razorpayKeyId: source.RAZORPAY_KEY_ID || '',
  };
}

// ── Default Singleton Instance for App Runtime ────────────────────────────────
export const ENV: CustomerApiConfig = createApiConfig(getRuntimeEnv());

/**
 * Diagnostic helper that exposes sanitized runtime target information
 * (Safe for development logs; never reveals credentials, tokens, or PII)
 */
export function getApiConfigDiagnostics(config: CustomerApiConfig = ENV): {
  customerTarget: string;
  customerBaseUrl: string;
  matrixMode: string;
} {
  const matrixMode = `Customer: ${config.customer.targetMode}`;
  return {
    customerTarget: config.customer.targetMode,
    customerBaseUrl: config.customer.resolvedBaseUrl,
    matrixMode,
  };
}

// Startup diagnostic banner in DEV mode
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  const diag = getApiConfigDiagnostics(ENV);
  console.log('[CoBuddy Config] Active Backend Matrix:', diag.matrixMode);
  console.log(`[CoBuddy Config] Customer API [${diag.customerTarget}]: ${diag.customerBaseUrl}`);
}
