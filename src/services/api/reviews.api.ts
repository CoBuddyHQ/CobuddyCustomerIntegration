/**
 * CoBuddy Customer — Reviews API Service
 * Maps to backend: src/modules/reviews/reviews.controller.ts
 */

import apiClient from './apiClient';

export interface Review {
  id: string;
  companionId: string;
  companionName?: string;
  bookingId?: string;
  sessionId?: string;
  rating: number;
  text?: string;
  tags?: string[];
  categoryRatings?: {
    punctuality?: number;
    communication?: number;
    behavior?: number;
  };
  createdAt: string;
}

export interface CreateReviewRequest {
  companionId: string;
  bookingId?: string;
  sessionId?: string;
  rating: number;
  text?: string;
  tags?: string[];
  categoryRatings?: {
    punctuality?: number;
    communication?: number;
    behavior?: number;
  };
}

// ─── Submit review ────────────────────────────────────────────────────────────
export const createReview = async (data: CreateReviewRequest): Promise<Review> => {
  const res = await apiClient.post<Review>('/reviews', data);
  return res.data;
};

// ─── Get my submitted reviews ─────────────────────────────────────────────────
export const getMyReviews = async (): Promise<Review[]> => {
  const res = await apiClient.get<Review[]>('/reviews/my');
  return res.data;
};

// ─── Get companion reviews (public) ───────────────────────────────────────────
export const getCompanionReviews = async (companionId: string): Promise<Review[]> => {
  const res = await apiClient.get<Review[]>(`/reviews/companion/${companionId}`);
  return res.data;
};
