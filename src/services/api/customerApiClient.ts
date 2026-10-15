/**
 * CoBuddy Customer — Dedicated Customer API Client
 *
 * Exclusively communicates with the Customer Backend.
 * Base URL is resolved from USE_AZURE_CUSTOMER_API flag via ENV.customer.resolvedBaseUrl.
 *
 * Responsibilities:
 * - Attach Customer Bearer JWT from TokenStorage
 * - Handle 401: Refresh token rotation against Customer Backend /auth/refresh
 * - Automatically unwrap NestJS { success: true, data: T } response envelopes
 * - Strict error propagation: NEVER silently falls back to alternative backend
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../../config/env';

export const CUSTOMER_BASE_URL: string = ENV.customer.resolvedBaseUrl;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'cb_access_token',
  REFRESH_TOKEN: 'cb_refresh_token',
  USER: 'cb_user',
} as const;

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
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async clearAll(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER),
    ]);
  },
};

type LogoutListener = () => void;
let _logoutListener: LogoutListener | null = null;
export const setLogoutListener = (fn: LogoutListener) => {
  _logoutListener = fn;
};

export const customerApiClient: AxiosInstance = axios.create({
  baseURL: CUSTOMER_BASE_URL,
  timeout: ENV.requestTimeoutMs || 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

customerApiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await TokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (
      config.data instanceof FormData ||
      (config.headers && config.headers['Content-Type'] === 'multipart/form-data')
    ) {
      delete config.headers['Content-Type'];
    }
    if (ENV.enableLogging && typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(
        `[Customer API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
        config.data instanceof FormData ? '[FormData]' : (config.data ?? '')
      );
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let _isRefreshing = false;
let _refreshQueue: Array<(token: string) => void> = [];

const processRefreshQueue = (newToken: string) => {
  _refreshQueue.forEach((cb) => cb(newToken));
  _refreshQueue = [];
};

customerApiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (ENV.enableLogging && typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`[Customer API] ✅ ${response.config.url}`, response.data);
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
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (_isRefreshing) {
        return new Promise((resolve) => {
          _refreshQueue.push((token: string) => {
            if (originalRequest.headers) {
              (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`;
            }
            resolve(customerApiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      _isRefreshing = true;

      try {
        const refreshToken = await TokenStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${CUSTOMER_BASE_URL}/auth/refresh`, { refreshToken });
        const payload = data && typeof data === 'object' && 'data' in data ? data.data : data;
        const { accessToken, refreshToken: newRefresh } = payload;

        await TokenStorage.setTokens(accessToken, newRefresh);
        processRefreshQueue(accessToken);

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
        }
        return customerApiClient(originalRequest);
      } catch {
        _refreshQueue = [];
        await TokenStorage.clearAll();
        _logoutListener?.();
        return Promise.reject(error);
      } finally {
        _isRefreshing = false;
      }
    }

    if (ENV.enableLogging && typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(
        `[Customer API] ❌ ${error.config?.baseURL}${error.config?.url}`,
        error.response?.data ?? error.message
      );
    }

    return Promise.reject(error);
  }
);

export default customerApiClient;
