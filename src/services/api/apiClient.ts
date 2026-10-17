/**
 * Centralized Customer Backend API client exports.
 */

import customerApiClient, {
  CUSTOMER_BASE_URL,
  TokenStorage,
  setLogoutListener,
  STORAGE_KEYS,
} from './customerApiClient';
import { extractErrorMessage } from '../../utils/errorHandler';

export const BASE_URL: string = CUSTOMER_BASE_URL;

export {
  customerApiClient,
  CUSTOMER_BASE_URL,
  TokenStorage,
  setLogoutListener,
  STORAGE_KEYS,
};

export const getApiError = (error: unknown): string => {
  return extractErrorMessage(error);
};

export default customerApiClient;
