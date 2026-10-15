/**
 * CoBuddy Customer — Centralized API Client Module
 *
 * Re-exports both specialized clients:
 * - customerApiClient: communicates with Customer Backend (USE_AZURE_CUSTOMER_API)
 * - campaignApiClient: communicates with Campaign Backend (USE_AZURE_CAMPAIGN_API)
 *
 * For full backward-compatibility with existing code, default export is customerApiClient.
 */

import customerApiClient, {
  CUSTOMER_BASE_URL,
  TokenStorage,
  setLogoutListener,
  STORAGE_KEYS,
} from './customerApiClient';
import campaignApiClient, { CAMPAIGN_BASE_URL } from './campaignApiClient';
import { extractErrorMessage } from '../../utils/errorHandler';

export const BASE_URL: string = CUSTOMER_BASE_URL;

export {
  customerApiClient,
  campaignApiClient,
  CUSTOMER_BASE_URL,
  CAMPAIGN_BASE_URL,
  TokenStorage,
  setLogoutListener,
  STORAGE_KEYS,
};

export const getApiError = (error: unknown): string => {
  return extractErrorMessage(error);
};

export default customerApiClient;
