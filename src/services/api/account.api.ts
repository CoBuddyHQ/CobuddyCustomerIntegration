/**
 * CoBuddy Customer — Account API Service
 * Maps to backend: src/modules/account/account.controller.ts
 */

import apiClient from './apiClient';

export interface AccountSettings {
  appLanguage?: string;
  spokenLanguages?: string[];
  notificationBookings?: boolean;
  notificationMessages?: boolean;
  notificationPromotions?: boolean;
  notificationSafety?: boolean;
  appLockEnabled?: boolean;
  biometricEnabled?: boolean;
  locationSharingEnabled?: boolean;
}

export interface ActiveSession {
  id: string;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: string;
  expiresAt: string;
  isCurrent?: boolean;
}

export interface BlockedUser {
  id: string;
  name?: string;
  avatar?: string | null;
  blockedAt: string;
}

export interface NotificationPreferences {
  bookings: boolean;
  messages: boolean;
  promotions: boolean;
  safety: boolean;
  system: boolean;
}

// ─── Get account settings ─────────────────────────────────────────────────────
export const getAccountSettings = async (): Promise<AccountSettings> => {
  const res = await apiClient.get<AccountSettings>('/account/settings');
  return res.data;
};

// ─── Update account settings ──────────────────────────────────────────────────
export const updateAccountSettings = async (data: Partial<AccountSettings>): Promise<AccountSettings> => {
  const res = await apiClient.patch<AccountSettings>('/account/settings', data);
  return res.data;
};

// ─── Get active login sessions ────────────────────────────────────────────────
export const getActiveSessions = async (): Promise<ActiveSession[]> => {
  const res = await apiClient.get<ActiveSession[]>('/account/sessions');
  return res.data;
};

// ─── Revoke a login session ───────────────────────────────────────────────────
export const revokeSession = async (sessionId: string): Promise<{ message: string }> => {
  const res = await apiClient.delete<{ message: string }>(`/account/sessions/${sessionId}`);
  return res.data;
};

// ─── Get blocked users ────────────────────────────────────────────────────────
export const getBlockedUsers = async (): Promise<BlockedUser[]> => {
  const res = await apiClient.get<BlockedUser[]>('/account/blocked');
  return res.data;
};

// ─── Block user ───────────────────────────────────────────────────────────────
export const blockUser = async (userId: string): Promise<{ message: string }> => {
  const res = await apiClient.post<{ message: string }>(`/account/block/${userId}`);
  return res.data;
};

// ─── Unblock user ─────────────────────────────────────────────────────────────
export const unblockUser = async (userId: string): Promise<{ message: string }> => {
  const res = await apiClient.delete<{ message: string }>(`/account/unblock/${userId}`);
  return res.data;
};

// ─── Deactivate account ───────────────────────────────────────────────────────
export const deactivateAccount = async (): Promise<{ message: string }> => {
  const res = await apiClient.post<{ message: string }>('/account/deactivate');
  return res.data;
};

// ─── Delete account ───────────────────────────────────────────────────────────
export const deleteAccount = async (): Promise<{ message: string }> => {
  const res = await apiClient.delete<{ message: string }>('/account/delete');
  return res.data;
};

// ─── Get notification preferences ────────────────────────────────────────────
export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const res = await apiClient.get<NotificationPreferences>('/account/notification-preferences');
  return res.data;
};

// ─── Update notification preferences ─────────────────────────────────────────
export const updateNotificationPreferences = async (data: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
  const res = await apiClient.patch<NotificationPreferences>('/account/notification-preferences', data);
  return res.data;
};

// ─── Get languages ────────────────────────────────────────────────────────────
export const getLanguages = async (): Promise<{ appLanguage: string; spokenLanguages: string[] }> => {
  const res = await apiClient.get<{ appLanguage: string; spokenLanguages: string[] }>('/account/languages');
  return res.data;
};

// ─── Update languages ─────────────────────────────────────────────────────────
export const updateLanguages = async (data: { appLanguage?: string; spokenLanguages?: string[] }): Promise<{ message: string }> => {
  const res = await apiClient.patch<{ message: string }>('/account/languages', data);
  return res.data;
};

// ─── Submit reactivation request ──────────────────────────────────────────────
export const submitReactivationRequest = async (data: {
  phone?: string;
  email?: string;
  reason?: string;
}): Promise<{ message: string }> => {
  const res = await apiClient.post<{ message: string }>('/account/reactivate-request', data);
  return res.data;
};
