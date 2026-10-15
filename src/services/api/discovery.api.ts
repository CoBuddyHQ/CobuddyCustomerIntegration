/**
 * CoBuddy Customer — Discovery API Service
 * Maps to backend: src/modules/discovery/discovery.controller.ts
 */

import { customerApiClient, campaignApiClient } from './apiClient';

export interface CompanionCard {
  id: string;
  name: string;
  age?: number;
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
  companions: CompanionCard[];
  data: CompanionCard[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface CompanionFilterParams {
  category?: string;
  gender?: string;
  search?: string;
  city?: string;
  minRating?: number;
  maxDistance?: number;
  isOnline?: boolean;
  maxPrice?: number;
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
  const res = await customerApiClient.get<any>('/discovery/companions', { params });
  const data = res.data;
  const list = Array.isArray(data) ? data : (data?.companions || data?.data || []);
  return {
    companions: list,
    data: list,
    total: data?.total ?? list.length,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
    totalPages: data?.totalPages ?? 1,
  };
};

// ─── Get featured companions ──────────────────────────────────────────────────
export const getFeaturedCompanions = async (): Promise<CompanionCard[]> => {
  const res = await customerApiClient.get<CompanionCard[]>('/discovery/featured');
  return res.data;
};

// ─── Get companion detail ─────────────────────────────────────────────────────
export const getCompanionDetail = async (id: string): Promise<CompanionDetail> => {
  const res = await customerApiClient.get<CompanionDetail>(`/discovery/companions/${id}`);
  return res.data;
};

// ─── Get favorites ─────────────────────────────────────────────────────────────
export const getFavorites = async (): Promise<CompanionCard[]> => {
  const res = await customerApiClient.get<CompanionCard[]>('/discovery/favorites');
  return res.data;
};

// ─── Add to favorites ─────────────────────────────────────────────────────────
export const addFavorite = async (companionId: string): Promise<{ message: string }> => {
  const res = await customerApiClient.post<{ message: string }>(`/discovery/favorites/${companionId}`);
  return res.data;
};

// ─── Remove from favorites ────────────────────────────────────────────────────
export const removeFavorite = async (companionId: string): Promise<{ message: string }> => {
  const res = await customerApiClient.delete<{ message: string }>(`/discovery/favorites/${companionId}`);
  return res.data;
};

// ─── Get interest tags ─────────────────────────────────────────────────────────
export const getInterests = async (): Promise<InterestTag[]> => {
  const res = await customerApiClient.get<InterestTag[]>('/discovery/interests');
  return res.data;
};

// ─── Get booking activities ────────────────────────────────────────────────────
export const getActivities = async (): Promise<ActivityOption[]> => {
  const res = await customerApiClient.get<ActivityOption[]>('/discovery/activities');
  return res.data;
};

export interface HomeCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
}

export interface Campaign {
  id: string;
  title: string;
  message: string;
  category?: string;
  targetAudience?: string;
  bannerUrl?: string | null;
  actionUrl?: string | null;
  publishedAt?: string;
  expiresAt?: string | null;
}

export interface HomeDashboardResponse {
  success: boolean;
  data: {
    profile?: {
      id: string;
      name?: string;
      photoUrl?: string;
      city?: string;
      gender?: string;
      interests?: string[];
    } | null;
    categories: HomeCategory[];
    featuredCompanions: CompanionCard[];
    campaigns?: Campaign[];
    quickAccess: {
      notificationCount: number;
      bookingCount: number;
    };
    activeBooking?: any | null;
  };
}

// ─── Get Home Dashboard aggregated data ───────────────────────────────────────
export const getHomeDashboardData = async (): Promise<HomeDashboardResponse['data']> => {
  console.log('[API REQUEST] [Customer API] GET /discovery/home');
  try {
    const res = await customerApiClient.get<any>('/discovery/home');
    const data = (res.data && typeof res.data === 'object' && ('categories' in res.data || 'featuredCompanions' in res.data))
      ? res.data
      : (res.data?.data || res.data);

    console.log('[API RESPONSE] 200 GET /discovery/home', {
      categoriesCount: data?.categories?.length ?? 0,
      featuredCount: data?.featuredCompanions?.length ?? 0,
      campaignsCount: data?.campaigns?.length ?? 0,
      notificationCount: data?.quickAccess?.notificationCount ?? 0,
    });
    return data;
  } catch (err: any) {
    console.error('[API ERROR] [Customer API] GET /discovery/home', err?.message || err);
    throw err;
  }
};

// ─── Get Active Marketing Campaigns (Routed via campaignApiClient) ─────────────
export const getCampaigns = async (): Promise<Campaign[]> => {
  console.log('[API REQUEST] [Campaign API] GET /campaigns');
  try {
    let res: any;
    try {
      res = await campaignApiClient.get<any>('/campaigns');
    } catch (primaryErr: any) {
      if (primaryErr?.response?.status === 404) {
        // Fallback for campaign servers exposing under discovery prefix
        res = await campaignApiClient.get<any>('/discovery/campaigns');
      } else {
        throw primaryErr;
      }
    }
    const raw = res?.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      if (Array.isArray(raw.campaigns)) return raw.campaigns;
      if (Array.isArray(raw.data)) return raw.data;
    }
    return [];
  } catch (err: any) {
    console.error('[API ERROR] [Campaign API] GET /campaigns', err?.message || err);
    return [];
  }
};


