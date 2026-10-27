/**
 * CoBuddy Customer — Discovery API Service
 * Maps to backend: src/modules/discovery/discovery.controller.ts
 */

import { customerApiClient } from './apiClient';

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
  displayName?: string | null;
  photoUrl?: string | null;
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
  name?: string;
  titleKey?: string;
  defaultTitle?: string;
  descKey?: string;
  defaultDesc?: string;
  icon?: string;
  price?: string;
}

// ─── Get companions list (with filters) ──────────────────────────────────────
export const getCompanions = async (params?: CompanionFilterParams): Promise<CompanionsListResponse> => {
  const res = await customerApiClient.get<unknown>('/discovery/companions', { params });
  const raw: unknown = res.data;
  const envelope = raw && typeof raw === 'object' ? raw as Record<string, unknown> : null;
  const nested = envelope?.data && typeof envelope.data === 'object'
    ? envelope.data as Record<string, unknown>
    : null;
  const listValue = Array.isArray(raw)
    ? raw
    : Array.isArray(envelope?.companions)
      ? envelope.companions
      : Array.isArray(envelope?.data)
        ? envelope.data
        : Array.isArray(nested?.companions)
          ? nested.companions
          : null;
  if (!listValue) throw new Error('Customer backend returned an invalid companion list.');
  const data = nested ?? envelope;
  const total = typeof data?.total === 'number' ? data.total : listValue.length;
  const page = typeof data?.page === 'number' ? data.page : 1;
  const limit = typeof data?.limit === 'number' ? data.limit : Math.max(listValue.length, 1);
  return {
    companions: listValue as CompanionCard[],
    data: listValue as CompanionCard[],
    total,
    page,
    limit,
    totalPages: typeof data?.totalPages === 'number' ? data.totalPages : 1,
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
  const res = await customerApiClient.get<unknown>('/discovery/activities');
  if (!Array.isArray(res.data)) {
    throw new Error('Customer backend returned an invalid activity list.');
  }

  return res.data.map((value: unknown, index: number) => {
    if (!value || typeof value !== 'object') {
      throw new Error(`Customer backend returned an invalid activity at index ${index}.`);
    }
    const activity = value as Record<string, unknown>;
    const id = typeof activity.id === 'string' ? activity.id.trim() : '';
    const title = [activity.defaultTitle, activity.name].some(
      (candidate) => typeof candidate === 'string' && candidate.trim().length > 0,
    );
    if (!id || !title) {
      throw new Error(`Customer backend returned an invalid activity at index ${index}.`);
    }

    return {
      id,
      name: typeof activity.name === 'string' ? activity.name : undefined,
      titleKey: typeof activity.titleKey === 'string' ? activity.titleKey : undefined,
      defaultTitle: typeof activity.defaultTitle === 'string' ? activity.defaultTitle : undefined,
      descKey: typeof activity.descKey === 'string' ? activity.descKey : undefined,
      defaultDesc: typeof activity.defaultDesc === 'string' ? activity.defaultDesc : undefined,
      icon: typeof activity.icon === 'string' ? activity.icon : undefined,
      price: typeof activity.price === 'string' ? activity.price : undefined,
    };
  });
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
    campaignsAvailable?: boolean;
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
  } catch (error: unknown) {
    console.warn('[API ERROR] [Customer API] GET /discovery/home failed.');
    throw error;
  }
};

// ─── Get active campaigns through the Customer Backend ────────────────────────
export const getCampaigns = async (): Promise<Campaign[]> => {
  console.log('[API REQUEST] [Customer API] GET /discovery/campaigns');
  try {
    const res: any = await customerApiClient.get<any>('/discovery/campaigns');
    const raw = res?.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      if (Array.isArray(raw.campaigns)) return raw.campaigns;
      if (Array.isArray(raw.data)) return raw.data;
    }
    throw new Error('Customer backend returned an invalid campaign response.');
  } catch (error: unknown) {
    console.warn('[API ERROR] [Customer API] GET /discovery/campaigns failed.');
    throw error;
  }
};


