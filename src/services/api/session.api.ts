/**
 * CoBuddy Customer — Session API Service
 * Maps to backend: src/modules/session/session.controller.ts
 */

import apiClient from './apiClient';

export interface Session {
  id: string;
  bookingId: string;
  companionId: string;
  companionName?: string;
  customerId: string;
  status: 'active' | 'completed' | 'ended_early' | 'checked_in' | 'extending';
  startedAt?: string;
  endedAt?: string;
  durationMinutes?: number;
  extensionMinutes?: number;
  passCode?: string;
  checkedIn?: boolean;
  tipAmount?: number;
  booking?: any;
}

export interface SessionPass {
  sessionId: string;
  passCode: string;
  companionName: string;
  activity: string;
  venue: string;
  startTime: string;
  duration: number;
  qrData?: string;
}

// ─── Get current session ──────────────────────────────────────────────────────
export const getCurrentSession = async (): Promise<Session | null> => {
  const res = await apiClient.get<Session | null>('/sessions/current');
  return res.data;
};

// ─── Get session history ──────────────────────────────────────────────────────
export const getSessionHistory = async (): Promise<Session[]> => {
  const res = await apiClient.get<Session[]>('/sessions/history');
  return res.data;
};

// ─── Check in ─────────────────────────────────────────────────────────────────
export const checkIn = async (bookingId: string, passCode?: string): Promise<Session> => {
  const res = await apiClient.post<Session>('/sessions/check-in', { bookingId, passCode });
  return res.data;
};

// ─── Get session pass ─────────────────────────────────────────────────────────
export const getSessionPass = async (sessionId: string): Promise<SessionPass> => {
  const res = await apiClient.get<SessionPass>(`/sessions/${sessionId}/pass`);
  return res.data;
};

// ─── Extend session ───────────────────────────────────────────────────────────
export const extendSession = async (sessionId: string, extraMinutes: number): Promise<Session> => {
  const res = await apiClient.patch<Session>(`/sessions/${sessionId}/extend`, { extraMinutes });
  return res.data;
};

// ─── End session ──────────────────────────────────────────────────────────────
export const endSession = async (sessionId: string, tip?: number): Promise<Session> => {
  const res = await apiClient.patch<Session>(`/sessions/${sessionId}/end`, { tip });
  return res.data;
};

// ─── Submit tip ───────────────────────────────────────────────────────────────
export const submitTip = async (sessionId: string, amount: number, paymentMethod?: string): Promise<{ message: string }> => {
  const res = await apiClient.post<{ message: string }>(`/sessions/${sessionId}/tip`, { amount, paymentMethod });
  return res.data;
};

// ─── Submit feedback ──────────────────────────────────────────────────────────
export const submitFeedback = async (
  sessionId: string,
  sentiment: 'up' | 'down',
  tags: string[],
): Promise<{ message: string }> => {
  const res = await apiClient.post<{ message: string }>(`/sessions/${sessionId}/feedback`, { sentiment, tags });
  return res.data;
};
