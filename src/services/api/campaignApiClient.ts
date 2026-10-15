/**
 * CoBuddy Customer — Dedicated Campaign API Client
 *
 * Exclusively communicates with the Campaign Backend.
 * Base URL is resolved from USE_AZURE_CAMPAIGN_API flag via ENV.campaign.resolvedBaseUrl.
 *
 * Responsibilities:
 * - Query public campaign catalog, promotions, and announcements
 * - Strictly isolates authentication: Does NOT leak Customer JWT tokens to Campaign backend
 * - Automatically unwrap NestJS { success: true, data: T } or { campaigns: [...] } responses
 * - Strict error propagation: NEVER silently falls back to alternative backend
 */

import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import { ENV } from '../../config/env';

export const CAMPAIGN_BASE_URL: string = ENV.campaign.resolvedBaseUrl;

export const campaignApiClient: AxiosInstance = axios.create({
  baseURL: CAMPAIGN_BASE_URL,
  timeout: ENV.requestTimeoutMs || 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

campaignApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Note: Campaign public catalog is intentionally public. Customer token is NOT attached.
    if (ENV.enableLogging && typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`[Campaign API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

campaignApiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (ENV.enableLogging && typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`[Campaign API] ✅ ${response.config.url}`, response.data);
    }
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  (error: AxiosError) => {
    if (ENV.enableLogging && typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(
        `[Campaign API] ❌ ${error.config?.baseURL}${error.config?.url}`,
        error.response?.data ?? error.message
      );
    }
    return Promise.reject(error);
  }
);

export default campaignApiClient;
