/**
 * CoBuddy Customer — Notifications API Service
 * Maps to backend: src/modules/notifications/notifications.controller.ts
 */

import apiClient from './apiClient';

export interface Notification {
  id: string;
  type?: string;
  title: string;
  description?: string;
  body?: string;
  category?: string;
  icon?: string;
  iconColor?: string;
  route?: string;
  stack?: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

// ─── List notifications ───────────────────────────────────────────────────────
export const listNotifications = async (): Promise<Notification[]> => {
  const res = await apiClient.get<any>('/notifications');
  const data = res.data;
  if (Array.isArray(data)) return data;
  if (data?.notifications && Array.isArray(data.notifications)) return data.notifications;
  return [];
};

// ─── Mark single notification as read ────────────────────────────────────────
export const markNotificationAsRead = async (id: string): Promise<{ message: string }> => {
  const res = await apiClient.patch<{ message: string }>(`/notifications/${id}/read`);
  return res.data;
};

// ─── Mark all as read ─────────────────────────────────────────────────────────
export const markAllNotificationsAsRead = async (): Promise<{ message: string }> => {
  const res = await apiClient.patch<{ message: string }>('/notifications/read-all');
  return res.data;
};

// ─── Delete notification ──────────────────────────────────────────────────────
export const deleteNotification = async (id: string): Promise<{ message: string }> => {
  const res = await apiClient.delete<{ message: string }>(`/notifications/${id}`);
  return res.data;
};

// ─── Register FCM device token ────────────────────────────────────────────────
export const registerDeviceToken = async (fcmToken: string): Promise<{ message: string }> => {
  const res = await apiClient.post<{ message: string }>('/notifications/device-token', { fcmToken });
  return res.data;
};

// ─── Update notification permission ───────────────────────────────────────────
export const updateNotificationPermission = async (data: {
  enabled?: boolean;
  fcmToken?: string;
  skipped?: boolean;
}): Promise<{ success: boolean; message: string; notificationsEnabled: boolean; onboardingStep: string }> => {
  const res = await apiClient.post<{ success: boolean; message: string; notificationsEnabled: boolean; onboardingStep: string }>(
    '/notifications/permission',
    data,
  );
  return res.data;
};

// ─── Skip notification step ───────────────────────────────────────────────────
export const skipNotificationPermission = async (): Promise<{ success: boolean; message: string; notificationsEnabled: boolean; onboardingStep: string }> => {
  const res = await apiClient.post<{ success: boolean; message: string; notificationsEnabled: boolean; onboardingStep: string }>(
    '/notifications/skip',
  );
  return res.data;
};
