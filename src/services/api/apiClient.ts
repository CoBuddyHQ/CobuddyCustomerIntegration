/**
 * CoBuddy Customer — Centralized Axios API Client
 *
 * Responsibilities:
 *  - Single base URL for all requests (Customer Backend port 4002)
 *  - Automatic Authorization header injection from AsyncStorage
 *  - 401 handling: attempt refresh token rotation, retry original request once
 *  - On refresh failure: clear session, broadcast logout
 *  - Multipart/form-data support for file uploads
 *  - Dev-only request/response logging
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Production Azure App Service — India South Central.
 * This is used for BOTH release builds AND debug builds running on the emulator
 * that should connect to the deployed Azure backend.
 *
 * ⚠️  LOCAL DEV OVERRIDE: If you are running the backend locally on port 4002
 *     and want the emulator to connect to it, change AZURE_API_URL to:
 *       'http://10.0.2.2:4002/api/v1'      (Android emulator)
 *       'http://localhost:4002/api/v1'      (iOS Simulator)
 *
 * ⚠️  Never commit real secrets (.env, JWT keys, DB passwords) here.
 *     The base URL is not a secret — it appears in every network request.
 */
const AZURE_API_URL = 'https://cobuddy-customer-api-avinash-gshhhhfbdrf2dab4.indiasouthcentral-01.azurewebsites.net/api/v1';

export const BASE_URL: string = AZURE_API_URL;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'cb_access_token',
  REFRESH_TOKEN: 'cb_refresh_token',
  USER: 'cb_user',
} as const;

// ─── Token helpers ────────────────────────────────────────────────────────────

export const TokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },
  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
  async setTokens(access: string, refresh: string): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access),
      AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh),
    ]);
  },
  async setUser(user: object): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },
  async getUser<T = unknown>(): Promise<T | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  },
  async clearAll(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER),
    ]);
  },
};

// ─── Session-clear listener (call from authStore.logout) ────────────────────
// Screens subscribe to this to navigate to login when session expires.
type LogoutListener = () => void;
let _logoutListener: LogoutListener | null = null;
export const setLogoutListener = (fn: LogoutListener) => { _logoutListener = fn; };

// ─── Axios Instance ──────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor: Attach access token ─────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await TokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData || (config.headers && config.headers['Content-Type'] === 'multipart/form-data')) {
      delete config.headers['Content-Type'];
    }
    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data instanceof FormData ? '[FormData]' : (config.data ?? ''));
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor: Token refresh on 401 ───────────────────────────

let _isRefreshing = false;
let _refreshQueue: Array<(token: string) => void> = [];

const processRefreshQueue = (newToken: string) => {
  _refreshQueue.forEach((cb) => cb(newToken));
  _refreshQueue = [];
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) {
      console.log(`[API] ✅ ${response.config.url}`, response.data);
    }
    // Automatically unwrap NestJS ResponseInterceptor payload { success: true, data: T }
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
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (_isRefreshing) {
        // Queue requests while refresh is in flight
        return new Promise((resolve) => {
          _refreshQueue.push((token: string) => {
            if (originalRequest.headers) {
              (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      _isRefreshing = true;

      try {
        const refreshToken = await TokenStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const payload = (data && typeof data === 'object' && 'data' in data) ? data.data : data;
        const { accessToken, refreshToken: newRefresh } = payload;

        await TokenStorage.setTokens(accessToken, newRefresh);
        processRefreshQueue(accessToken);

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch {
        // Refresh failed — force logout
        _refreshQueue = [];
        await TokenStorage.clearAll();
        _logoutListener?.();
        return Promise.reject(error);
      } finally {
        _isRefreshing = false;
      }
    }

    if (__DEV__) {
      console.warn(`[API] ❌ ${error.config?.url}`, error.response?.data ?? error.message);
    }

    return Promise.reject(error);
  },
);

export default apiClient;

import { extractErrorMessage } from '../../utils/errorHandler';

export const getApiError = (error: unknown): string => {
  return extractErrorMessage(error);
};
