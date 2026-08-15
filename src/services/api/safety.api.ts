/**
 * CoBuddy Customer — Safety API Service
 * Maps to backend: src/modules/safety/safety.controller.ts
 */

import apiClient from './apiClient';

export interface SOSEvent {
  id: string;
  sessionId?: string;
  lat?: number;
  lng?: number;
  status: 'active' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  createdAt?: string;
}

export interface IncidentReport {
  id: string;
  companionId?: string;
  bookingId?: string;
  description: string;
  evidenceUrls?: string[];
  status: string;
  createdAt: string;
}

// ─── Trigger SOS ──────────────────────────────────────────────────────────────
export const triggerSOS = async (sessionId?: string, lat?: number, lng?: number): Promise<SOSEvent> => {
  const res = await apiClient.post<SOSEvent>('/safety/sos/trigger', { sessionId, lat, lng });
  return res.data;
};

// ─── Resolve SOS ──────────────────────────────────────────────────────────────
export const resolveSOS = async (id: string): Promise<SOSEvent> => {
  const res = await apiClient.patch<SOSEvent>(`/safety/sos/${id}/resolve`);
  return res.data;
};

// ─── Get SOS history ──────────────────────────────────────────────────────────
export const getSOSHistory = async (): Promise<SOSEvent[]> => {
  const res = await apiClient.get<SOSEvent[]>('/safety/sos/history');
  return res.data;
};

// ─── Get trusted contacts ─────────────────────────────────────────────────────
export const getTrustedContacts = async (): Promise<TrustedContact[]> => {
  const res = await apiClient.get<TrustedContact[]>('/safety/trusted-contacts');
  return res.data;
};

// ─── Add trusted contact ──────────────────────────────────────────────────────
export const addTrustedContact = async (data: { name: string; phone: string; relationship: string }): Promise<TrustedContact> => {
  const res = await apiClient.post<TrustedContact>('/safety/trusted-contacts', data);
  return res.data;
};

// ─── Update trusted contact ───────────────────────────────────────────────────
export const updateTrustedContact = async (
  id: string,
  data: Partial<{ name: string; phone: string; relationship: string }>,
): Promise<TrustedContact> => {
  const res = await apiClient.patch<TrustedContact>(`/safety/trusted-contacts/${id}`, data);
  return res.data;
};

// ─── Delete trusted contact ───────────────────────────────────────────────────
export const deleteTrustedContact = async (id: string): Promise<{ message: string }> => {
  const res = await apiClient.delete<{ message: string }>(`/safety/trusted-contacts/${id}`);
  return res.data;
};

// ─── Create incident report ────────────────────────────────────────────────────
export const createIncidentReport = async (data: {
  companionId?: string;
  bookingId?: string;
  description: string;
  evidenceUrls?: string[];
}): Promise<IncidentReport> => {
  const res = await apiClient.post<IncidentReport>('/safety/incidents', data);
  return res.data;
};

// ─── Get incident reports ─────────────────────────────────────────────────────
export const getIncidentReports = async (): Promise<IncidentReport[]> => {
  const res = await apiClient.get<IncidentReport[]>('/safety/incidents');
  return res.data;
};
