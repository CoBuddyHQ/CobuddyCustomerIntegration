/**
 * CoBuddy Customer — Profile API Service
 * Maps to backend: src/modules/profile/profile.controller.ts
 *
 * Endpoints:
 *  GET    /profile
 *  PATCH  /profile
 *  POST   /profile/complete-onboarding
 *  GET    /profile/completion
 *  POST   /profile/photo   (multipart)
 *  DELETE /profile/photo
 *  PATCH  /profile/location
 *  PATCH  /profile/interests
 */

import apiClient from './apiClient';

export interface CustomerProfile {
  id: string;
  phone: string;
  name?: string | null;
  email?: string | null;
  bio?: string | null;
  age?: number | null;
  gender?: string | null;
  city?: string | null;
  countryCode?: string | null;
  avatar?: string | null;
  accountStatus: string;
  onboardingComplete: boolean;
  kycStatus: string;
  interests?: string[];
  spokenLanguages?: string[];
  referralCode?: string | null;
  trustScore?: number;
  totalSessions?: number;
  createdAt?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  bio?: string;
  age?: number;
  dob?: string;
  gender?: string;
  city?: string;
  photoUrl?: string;
  countryCode?: string;
}

export interface CompleteOnboardingRequest {
  name?: string;
  city?: string;
  gender?: string;
  age?: number;
}

export interface ProfileCompletion {
  percentage: number;
  missing: string[];
  completed: string[];
}

export interface LegalConsentRequest {
  tosAccepted?: boolean;
  privacyAccepted?: boolean;
  communityGuidelinesAccepted?: boolean;
  safetyAgreementAccepted?: boolean;
  allAccepted?: boolean;
}

export interface OnboardingProgressResponse {
  isOnboardingComplete: boolean;
  currentStep: string;
  completedSteps: string[];
  customer?: CustomerProfile;
}

// ─── Submit legal consent ─────────────────────────────────────────────────────
export const submitLegalConsent = async (data: LegalConsentRequest): Promise<{ success: boolean; message: string; onboardingStep: string }> => {
  const res = await apiClient.post<{ success: boolean; message: string; onboardingStep: string }>('/profile/legal-consent', data);
  return res.data;
};

// ─── Get onboarding progress ──────────────────────────────────────────────────
export const getOnboardingProgress = async (): Promise<OnboardingProgressResponse> => {
  const res = await apiClient.get<OnboardingProgressResponse>('/profile/onboarding-progress');
  return res.data;
};

// ─── Get profile ──────────────────────────────────────────────────────────────
export const getProfile = async (): Promise<CustomerProfile> => {
  const res = await apiClient.get<CustomerProfile>('/profile');
  return res.data;
};

// ─── Update profile ───────────────────────────────────────────────────────────
export const updateProfile = async (data: UpdateProfileRequest): Promise<CustomerProfile> => {
  const res = await apiClient.patch<CustomerProfile>('/profile', data);
  return res.data;
};

// ─── Complete onboarding ──────────────────────────────────────────────────────
export const completeOnboarding = async (data: CompleteOnboardingRequest): Promise<{ message: string; customer: CustomerProfile }> => {
  const res = await apiClient.post<{ message: string; customer: CustomerProfile }>('/profile/complete-onboarding', data);
  return res.data;
};

// ─── Profile completion status ────────────────────────────────────────────────
export const getProfileCompletion = async (): Promise<ProfileCompletion> => {
  const res = await apiClient.get<ProfileCompletion>('/profile/completion');
  return res.data;
};

// ─── Upload profile photo ─────────────────────────────────────────────────────
export const uploadProfilePhoto = async (localUri: string, mimeType: string = 'image/jpeg'): Promise<{ photoUrl: string }> => {
  const formData = new FormData();
  const filename = localUri.split('/').pop() || 'photo.jpg';
  formData.append('file', { uri: localUri, name: filename, type: mimeType } as unknown as Blob);
  const res = await apiClient.post<{ photoUrl: string }>('/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// ─── Delete profile photo ─────────────────────────────────────────────────────
export const deleteProfilePhoto = async (): Promise<{ message: string }> => {
  const res = await apiClient.delete<{ message: string }>('/profile/photo');
  return res.data;
};

// ─── Update location ──────────────────────────────────────────────────────────
export const updateLocation = async (data: {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  permissionGranted?: boolean;
  skipped?: boolean;
}): Promise<{ success: boolean; message: string; city?: string; latitude?: number; longitude?: number; locationPermissionGranted?: boolean }> => {
  const res = await apiClient.patch<{ success: boolean; message: string; city?: string; latitude?: number; longitude?: number; locationPermissionGranted?: boolean }>('/profile/location', data);
  return res.data;
};

// ─── Skip location step ───────────────────────────────────────────────────────
export const skipLocation = async (): Promise<{ success: boolean; message: string; locationPermissionGranted: boolean }> => {
  const res = await apiClient.post<{ success: boolean; message: string; locationPermissionGranted: boolean }>('/profile/location/skip');
  return res.data;
};

// ─── Update interests ─────────────────────────────────────────────────────────
export const updateInterests = async (interests: string[]): Promise<{ message: string }> => {
  const res = await apiClient.patch<{ message: string }>('/profile/interests', { interests });
  return res.data;
};
