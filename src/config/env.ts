/**
 * CoBuddy Customer — Centralized Environment & Dual-API Configuration
 *
 * Provides strongly-typed, independent target resolution for:
 * 1. Customer Backend API (USE_AZURE_CUSTOMER_API: Azure vs Local Docker)
 * 2. Campaign Backend API (USE_AZURE_CAMPAIGN_API: Azure vs Local Docker)
 *
 * Rules:
 * - True selects configured Azure URL; False selects configured Local Docker URL.
 * - Changing one flag NEVER affects the target of the other service.
 * - Local failure NEVER silently falls back to Azure, and vice-versa.
 * - Android emulator auto-resolves 'localhost'/'127.0.0.1' -> '10.0.2.2'.
 * - Production builds validate Azure endpoints use HTTPS.
 */

import { Platform } from 'react-native';
import {
  USE_AZURE_CUSTOMER_API as envUseAzureCustomer,
  USE_AZURE_CAMPAIGN_API as envUseAzureCampaign,
  AZURE_CUSTOMER_API_URL as envAzureCustomerUrl,
  LOCAL_CUSTOMER_API_URL as envLocalCustomerUrl,
  AZURE_CAMPAIGN_API_URL as envAzureCampaignUrl,
  LOCAL_CAMPAIGN_API_URL as envLocalCampaignUrl,
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
    USE_AZURE_CAMPAIGN_API: envUseAzureCampaign ?? (typeof process !== 'undefined' ? process.env?.USE_AZURE_CAMPAIGN_API : undefined),
    AZURE_CUSTOMER_API_URL: envAzureCustomerUrl ?? (typeof process !== 'undefined' ? process.env?.AZURE_CUSTOMER_API_URL : undefined),
    LOCAL_CUSTOMER_API_URL: envLocalCustomerUrl ?? (typeof process !== 'undefined' ? process.env?.LOCAL_CUSTOMER_API_URL : undefined),
    AZURE_CAMPAIGN_API_URL: envAzureCampaignUrl ?? (typeof process !== 'undefined' ? process.env?.AZURE_CAMPAIGN_API_URL : undefined),
    LOCAL_CAMPAIGN_API_URL: envLocalCampaignUrl ?? (typeof process !== 'undefined' ? process.env?.LOCAL_CAMPAIGN_API_URL : undefined),
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

export interface DualApiConfig {
  customer: ServiceTargetConfig;
  campaign: ServiceTargetConfig;
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
  serviceName: 'Customer' | 'Campaign',
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
    if (isProductionBuild && !azureUrl.startsWith('https://')) {
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
    return {
      useAzure: false,
      azureUrl,
      localUrl,
      resolvedBaseUrl: resolvedLocal.replace(/\/+$/, ''),
      targetMode: 'LOCAL',
    };
  }
}

/**
 * Factory for creating verified configuration from an arbitrary env object.
 */
export function createApiConfig(
  source: Record<string, string | undefined> = rawEnv,
  platformOs: string = Platform.OS
): DualApiConfig {
  const appEnv = (source.APP_ENV || 'development').trim().toLowerCase();
  const isDev = appEnv !== 'production';
  const isProductionBuild = !isDev;

  const useAzureCustomer = parseBooleanFlag(source.USE_AZURE_CUSTOMER_API, false);
  const useAzureCampaign = parseBooleanFlag(source.USE_AZURE_CAMPAIGN_API, false);

  const customer = resolveServiceUrl(
    'Customer',
    useAzureCustomer,
    source.AZURE_CUSTOMER_API_URL,
    source.LOCAL_CUSTOMER_API_URL,
    platformOs,
    isProductionBuild
  );

  const campaign = resolveServiceUrl(
    'Campaign',
    useAzureCampaign,
    source.AZURE_CAMPAIGN_API_URL,
    source.LOCAL_CAMPAIGN_API_URL,
    platformOs,
    isProductionBuild
  );

  return {
    customer,
    campaign,
    appEnv,
    isDev,
    enableLogging: parseBooleanFlag(source.ENABLE_LOGGING, true),
    defaultLanguage: source.DEFAULT_LANGUAGE || 'en',
    requestTimeoutMs: parseInt(source.REQUEST_TIMEOUT_MS || '15000', 10),
    googleMapsApiKey: source.GOOGLE_MAPS_API_KEY || '',
    razorpayKeyId: source.RAZORPAY_KEY_ID || '',
  };
}

// ── Default Singleton Instance for App Runtime ────────────────────────────────
export const ENV: DualApiConfig = createApiConfig(getRuntimeEnv());

/**
 * Diagnostic helper that exposes sanitized runtime target information
 * (Safe for development logs; never reveals credentials, tokens, or PII)
 */
export function getApiConfigDiagnostics(config: DualApiConfig = ENV): {
  customerTarget: string;
  customerBaseUrl: string;
  campaignTarget: string;
  campaignBaseUrl: string;
  matrixMode: string;
} {
  const matrixMode = `Customer: ${config.customer.targetMode} | Campaign: ${config.campaign.targetMode}`;
  return {
    customerTarget: config.customer.targetMode,
    customerBaseUrl: config.customer.resolvedBaseUrl,
    campaignTarget: config.campaign.targetMode,
    campaignBaseUrl: config.campaign.resolvedBaseUrl,
    matrixMode,
  };
}

// Startup diagnostic banner in DEV mode
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  const diag = getApiConfigDiagnostics(ENV);
  console.log('[CoBuddy Config] Active Backend Matrix:', diag.matrixMode);
  console.log(`[CoBuddy Config] Customer API [${diag.customerTarget}]: ${diag.customerBaseUrl}`);
  console.log(`[CoBuddy Config] Campaign API [${diag.campaignTarget}]: ${diag.campaignBaseUrl}`);
}
