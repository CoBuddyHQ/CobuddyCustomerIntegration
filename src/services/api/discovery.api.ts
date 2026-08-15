/**
 * CoBuddy Customer — Discovery API Service
 * Maps to backend: src/modules/discovery/discovery.controller.ts
 */

import apiClient from './apiClient';

export interface CompanionCard {
  id: string;
  name: string;
  initials?: string;
  title?: string;
  activities?: string[];
  trustScore?: number;
  rating?: number;
  reviews?: number;
  sessions?: number;
  rate?: string;
  distance?: string;
  isOnline?: boolean;
  category?: string;
  gender?: string;
  avatar?: string | null;
  bio?: string | null;
  city?: string | null;
}

export interface CompanionDetail extends Omit<CompanionCard, 'reviews'> {
  photos?: string[];
  location?: string;
  languages?: string[];
  personality?: string[];
  hobbies?: string[];
  pronouns?: string | null;
  lastActive?: string;
  responseTime?: string;
  responseRate?: string;
  memberSince?: string;
  completedSessions?: number;
  travelPreference?: string;
  pricing?: Array<{ activity: string; price: string; icon: string }>;
  schedule?: string;
  cancellationPolicy?: string;
  rules?: string[];
  verifications?: Array<{ label: string; icon: string; color: string }>;
  reviews?: {
    average: number;
    count: number;
    categories?: { punctuality?: number; communication?: number; behavior?: number };
    items?: Array<{ id: string; author: string; date: string; activity: string; text: string }>;
  };
}

export interface CompanionsListResponse {
  data: CompanionCard[];
  total: number;
  page: number;
  limit: number;
}

export interface CompanionFilterParams {
  category?: string;
  gender?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InterestTag {
  id: string;
  label: string;
  icon?: string;
  category?: string;
}

export interface ActivityOption {
  id: string;
  name: string;
  icon?: string;
  basePrice?: number;
  unit?: string;
}

// ─── Get companions list (with filters) ──────────────────────────────────────
export const getCompanions = async (params?: CompanionFilterParams): Promise<CompanionsListResponse> => {
  const res = await apiClient.get<CompanionsListResponse>('/discovery/companions', { params });
  return res.data;
};

// ─── Get featured companions ──────────────────────────────────────────────────
export const getFeaturedCompanions = async (): Promise<CompanionCard[]> => {
  const res = await apiClient.get<CompanionCard[]>('/discovery/featured');
  return res.data;
};

// ─── Get companion detail ─────────────────────────────────────────────────────
export const getCompanionDetail = async (id: string): Promise<CompanionDetail> => {
  const res = await apiClient.get<CompanionDetail>(`/discovery/companions/${id}`);
  return res.data;
};

// ─── Get favorites ─────────────────────────────────────────────────────────────
export const getFavorites = async (): Promise<CompanionCard[]> => {
  const res = await apiClient.get<CompanionCard[]>('/discovery/favorites');
  return res.data;
};

// ─── Add to favorites ─────────────────────────────────────────────────────────
export const addFavorite = async (companionId: string): Promise<{ message: string }> => {
  const res = await apiClient.post<{ message: string }>(`/discovery/favorites/${companionId}`);
  return res.data;
};

// ─── Remove from favorites ────────────────────────────────────────────────────
export const removeFavorite = async (companionId: string): Promise<{ message: string }> => {
  const res = await apiClient.delete<{ message: string }>(`/discovery/favorites/${companionId}`);
  return res.data;
};

// ─── Get interest tags ─────────────────────────────────────────────────────────
export const getInterests = async (): Promise<InterestTag[]> => {
  const res = await apiClient.get<InterestTag[]>('/discovery/interests');
  return res.data;
};

// ─── Get booking activities ────────────────────────────────────────────────────
export const getActivities = async (): Promise<ActivityOption[]> => {
  const res = await apiClient.get<ActivityOption[]>('/discovery/activities');
  return res.data;
};
