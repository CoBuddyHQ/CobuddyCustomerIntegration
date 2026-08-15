/**
 * CoBuddy Customer — Auth API Service
 * Maps to backend: src/modules/auth/auth.controller.ts
 *
 * Endpoints:
 *  POST /auth/send-otp
 *  POST /auth/verify-otp
 *  POST /auth/resend-otp
 *  POST /auth/refresh
 *  POST /auth/logout
 *  POST /auth/logout-all
 *  GET  /auth/me
 */

import apiClient from './apiClient';

export interface SendOtpRequest {
  phone: string;
  countryCode?: string;
}

export interface SendOtpResponse {
  message: string;
  devOtp?: string; // only in development mode
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

export interface CustomerFromAuth {
  id: string;
  phone: string;
  name?: string | null;
  avatar?: string | null;
  photoUrl?: string | null;
  bio?: string | null;
  age?: number | null;
  gender?: string | null;
  city?: string | null;
  countryCode?: string | null;
  accountStatus: string;
  isOnboardingComplete?: boolean;
  onboardingComplete?: boolean;
  kycStatus: string;
  interests?: string[];
  spokenLanguages?: string[];
  createdAt?: string;
  settings?: Record<string, unknown>;
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  isNewCustomer: boolean;
  customer: CustomerFromAuth;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ─── Send OTP ─────────────────────────────────────────────────────────────────
export const sendOtp = async (data: SendOtpRequest): Promise<SendOtpResponse> => {
  const res = await apiClient.post<SendOtpResponse>('/auth/send-otp', data);
  return res.data;
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export const verifyOtp = async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
  const res = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', data);
  return res.data;
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
export const resendOtp = async (phone: string): Promise<SendOtpResponse> => {
  const res = await apiClient.post<SendOtpResponse>('/auth/resend-otp', { phone });
  return res.data;
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refreshToken = async (token: string): Promise<RefreshTokenResponse> => {
  const res = await apiClient.post<RefreshTokenResponse>('/auth/refresh', { refreshToken: token });
  return res.data;
};

// ─── Logout current device ────────────────────────────────────────────────────
export const logout = async (refreshTokenStr?: string): Promise<void> => {
  await apiClient.post('/auth/logout', { refreshToken: refreshTokenStr });
};

// ─── Logout all devices ───────────────────────────────────────────────────────
export const logoutAll = async (): Promise<void> => {
  await apiClient.post('/auth/logout-all');
};

// ─── Get current customer (session restoration) ───────────────────────────────
export const getMe = async (): Promise<CustomerFromAuth> => {
  const res = await apiClient.get<CustomerFromAuth>('/auth/me');
  return res.data;
};
