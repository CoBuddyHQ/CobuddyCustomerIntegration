/**
 * CoBuddy Customer — Booking API Service
 * Maps to backend: src/modules/booking/booking.controller.ts
 */

import apiClient from './apiClient';

export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'countered' | 'active' | 'completed' | 'cancelled' | 'disputed';

export interface Booking {
  id: string;
  companionId: string;
  companionName?: string;
  customerId?: string;
  activity: string;
  venue: string;
  date: string;
  time: string;
  duration: number;
  status: BookingStatus;
  totalAmount?: number;
  notes?: string;
  cancellationReason?: string;
  counterOffer?: {
    proposedDate?: string;
    proposedTime?: string;
    proposedVenue?: string;
    message?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBookingRequest {
  companionId: string;
  companionName?: string;
  activity?: string;
  activityName?: string;
  activityId?: string;
  activityIcon?: string;
  venue?: string;
  venueName?: string;
  venueAddress?: string;
  date?: string;
  time?: string;
  duration?: number;
  durationHours?: number;
  notes?: string;
  specialInstructions?: string;
  baseRate?: number;
}

export interface CancelBookingRequest {
  reason: string;
}

export interface ModifyBookingRequest {
  date?: string;
  time?: string;
  venue?: string;
  venueName?: string;
  duration?: number;
  durationHours?: number;
  notes?: string;
}

export interface DisputeBookingRequest {
  reason: string;
  description: string;
}

export interface CounterOfferResponseRequest {
  action: 'accept' | 'decline';
}

// ─── Create booking ───────────────────────────────────────────────────────────
export const createBooking = async (data: CreateBookingRequest): Promise<Booking> => {
  const payload = {
    companionId: data.companionId,
    companionName: data.companionName,
    activityName: data.activityName || data.activity || 'Coffee Meetup',
    activityId: data.activityId,
    activityIcon: data.activityIcon,
    venueName: data.venueName || data.venue || 'Public Cafe',
    venueAddress: data.venueAddress,
    date: (data.date && data.date.includes('T')) ? data.date : `${data.date || new Date().toISOString().split('T')[0]}T00:00:00.000Z`,
    time: data.time || '18:00',
    durationHours: Number(data.durationHours || data.duration || 2),
    specialInstructions: data.specialInstructions || data.notes,
    baseRate: Number(data.baseRate || 500),
  };
  const res = await apiClient.post<Booking>('/bookings', payload);
  return res.data;
};

// ─── List bookings ────────────────────────────────────────────────────────────
export const listBookings = async (filter?: 'pending' | 'accepted' | 'history'): Promise<Booking[]> => {
  const res = await apiClient.get<Booking[]>('/bookings', { params: filter ? { filter } : undefined });
  return res.data;
};

// ─── Get booking detail ───────────────────────────────────────────────────────
export const getBooking = async (id: string): Promise<Booking> => {
  const res = await apiClient.get<Booking>(`/bookings/${id}`);
  return res.data;
};

// ─── Cancel booking ───────────────────────────────────────────────────────────
export const cancelBooking = async (id: string, data: CancelBookingRequest): Promise<Booking> => {
  const res = await apiClient.patch<Booking>(`/bookings/${id}/cancel`, data);
  return res.data;
};

// ─── Modify booking ───────────────────────────────────────────────────────────
export const modifyBooking = async (id: string, data: ModifyBookingRequest): Promise<Booking> => {
  const payload: Record<string, any> = {};
  if (data.date) payload.date = data.date;
  if (data.time) payload.time = data.time;
  if (data.venueName) payload.venueName = data.venueName;
  if (data.durationHours ?? data.duration) payload.durationHours = data.durationHours ?? data.duration;
  if (data.notes) payload.specialInstructions = data.notes;
  const res = await apiClient.patch<Booking>(`/bookings/${id}/modify`, payload);
  return res.data;
};

// ─── Respond to counter offer ──────────────────────────────────────────────────
export const respondToCounterOffer = async (id: string, data: CounterOfferResponseRequest): Promise<Booking> => {
  const res = await apiClient.patch<Booking>(`/bookings/${id}/counter-offer`, data);
  return res.data;
};

// ─── Dispute booking ──────────────────────────────────────────────────────────
export const disputeBooking = async (id: string, data: DisputeBookingRequest): Promise<{ message: string }> => {
  const res = await apiClient.post<{ message: string }>(`/bookings/${id}/dispute`, data);
  return res.data;
};
