/**
 * CoBuddy Customer — KYC API Service
 * Maps to backend: src/modules/kyc/kyc.controller.ts
 */

import apiClient from './apiClient';

export interface KycStatus {
  status: 'not_started' | 'unverified' | 'pending' | 'processing' | 'approved' | 'verified' | 'rejected' | 'resubmit';
  currentStep?: string;
  documentSubmitted?: boolean;
  selfieSubmitted?: boolean;
  livenessSubmitted?: boolean;
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
  documentType?: string;
  docType?: string;
  documentNumber?: string;
  docNumber?: string;
  legalName?: string;
  frontDocUri?: string;
  backDocUri?: string;
}): Promise<{ message: string }> => {
  const rawType = (data.docType || data.documentType || 'AADHAAR').toUpperCase();
  const normalizedType = rawType === 'DRIVING_LICENSE' ? 'DL' : rawType;
  const num = data.docNumber || data.documentNumber || '';
  const name = data.legalName || '';

  const isLocalFile = (uri?: string) =>
    uri?.startsWith('file://') || uri?.startsWith('content://');

  if (!isLocalFile(data.frontDocUri)) {
    throw new Error('A real local front document file is required. Remote sample URLs are not accepted.');
  }

  const formData = new FormData();
  formData.append('docType', normalizedType);
  formData.append('docNumber', num);
  formData.append('legalName', name);
  const frontUri = data.frontDocUri!;
  const frontFilename = frontUri.split('/').pop() || 'front.jpg';
  formData.append('frontDoc', {
    uri: frontUri,
    name: frontFilename,
    type: frontFilename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
  } as unknown as Blob);
  if (isLocalFile(data.backDocUri)) {
    const backFilename = data.backDocUri!.split('/').pop() || 'back.jpg';
    formData.append('backDoc', {
      uri: data.backDocUri,
      name: backFilename,
      type: backFilename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
    } as unknown as Blob);
  }

  const res = await apiClient.post<{ message: string }>('/kyc/document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// ─── Submit selfie ────────────────────────────────────────────────────────────
export const submitKycSelfie = async (localUri: string): Promise<{ message: string }> => {
  const isLocalFile = localUri.startsWith('file://') || localUri.startsWith('content://');
  if (!isLocalFile) {
    throw new Error('A real local selfie file is required. Remote sample URLs are not accepted.');
  }

  const formData = new FormData();
  const filename = localUri.split('/').pop() || 'selfie.jpg';
  formData.append('file', {
    uri: localUri,
    name: filename,
    type: filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
  } as unknown as Blob);

  const res = await apiClient.post<{ message: string }>('/kyc/selfie', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// ─── Submit liveness ──────────────────────────────────────────────────────────
export const submitKycLiveness = async (localUri: string): Promise<{ message: string }> => {
  const isLocalFile = localUri.startsWith('file://') || localUri.startsWith('content://');
  if (!isLocalFile) {
    throw new Error('A real local liveness video file is required. Remote sample URLs are not accepted.');
  }

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
