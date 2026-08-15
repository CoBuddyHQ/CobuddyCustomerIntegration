/**
 * CoBuddy Customer — KYC API Service
 * Maps to backend: src/modules/kyc/kyc.controller.ts
 */

import apiClient from './apiClient';

export interface KycStatus {
  status: 'not_started' | 'pending' | 'processing' | 'approved' | 'rejected' | 'resubmit';
  documentStatus?: string;
  selfieStatus?: string;
  livenessStatus?: string;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

// ─── Get KYC status ───────────────────────────────────────────────────────────
export const getKycStatus = async (): Promise<KycStatus> => {
  const res = await apiClient.get<KycStatus>('/kyc/status');
  return res.data;
};

// ─── Submit KYC document ──────────────────────────────────────────────────────
export const submitKycDocument = async (data: {
  documentType: string;
  documentNumber: string;
  frontDocUri: string;
  backDocUri?: string;
}): Promise<{ message: string }> => {
  const formData = new FormData();
  formData.append('documentType', data.documentType);
  formData.append('documentNumber', data.documentNumber);

  const frontFilename = data.frontDocUri.split('/').pop() || 'front.jpg';
  formData.append('frontDoc', { uri: data.frontDocUri, name: frontFilename, type: 'image/jpeg' } as unknown as Blob);

  if (data.backDocUri) {
    const backFilename = data.backDocUri.split('/').pop() || 'back.jpg';
    formData.append('backDoc', { uri: data.backDocUri, name: backFilename, type: 'image/jpeg' } as unknown as Blob);
  }

  const res = await apiClient.post<{ message: string }>('/kyc/document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// ─── Submit selfie ────────────────────────────────────────────────────────────
export const submitKycSelfie = async (localUri: string): Promise<{ message: string }> => {
  const formData = new FormData();
  const filename = localUri.split('/').pop() || 'selfie.jpg';
  formData.append('file', { uri: localUri, name: filename, type: 'image/jpeg' } as unknown as Blob);

  const res = await apiClient.post<{ message: string }>('/kyc/selfie', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// ─── Submit liveness ──────────────────────────────────────────────────────────
export const submitKycLiveness = async (localUri: string): Promise<{ message: string }> => {
  const formData = new FormData();
  const filename = localUri.split('/').pop() || 'liveness.mp4';
  formData.append('file', { uri: localUri, name: filename, type: 'video/mp4' } as unknown as Blob);

  const res = await apiClient.post<{ message: string }>('/kyc/liveness', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// ─── Resubmit KYC ─────────────────────────────────────────────────────────────
export const resubmitKyc = async (): Promise<{ message: string }> => {
  const res = await apiClient.post<{ message: string }>('/kyc/resubmit');
  return res.data;
};
