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
  activityName?: string;
  venue: string | any;
  venueName?: string;
  date: string;
  time: string;
  duration: number;
  durationHours?: number;
  status: BookingStatus;
  totalAmount?: number;
  matchScore?: number | null;
  companionRequestStatus?: 'sent' | 'unavailable';
  pricing?: {
    baseRate?: number;
    durationHours?: number;
    baseTotal?: number;
    platformFee?: number;
    taxAmount?: number;
    totalAmount?: number;
    formatted?: any;
  };
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
  scheduledStart?: string;
  duration?: number;
  durationHours?: number;
  safetyAcknowledged: boolean;
  notes?: string;
  specialInstructions?: string;
}

export interface BookingPriceQuote {
  currency: string;
  durationHours: number;
  multiplier: number;
  baseRate: number;
  baseTotal: number;
  platformFee: number;
  taxAmount: number;
  totalAmount: number;
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

export const getBookingPriceQuote = async (data: {
  companionId: string;
  activityId?: string;
  durationHours: number;
}): Promise<BookingPriceQuote> => {
  const res = await apiClient.post<BookingPriceQuote>('/bookings/quote', data);
  return res.data;
};

// ─── Create booking ───────────────────────────────────────────────────────────
export const createBooking = async (data: CreateBookingRequest): Promise<Booking> => {
  const activityName = data.activityName || data.activity;
  const venueName = data.venueName || data.venue;
  const durationHours = Number(data.durationHours ?? data.duration);
  if (!data.companionId || !data.activityId || !activityName || !venueName || !data.date || !data.time) {
    throw new Error('Companion, activity, venue, date, and time are required to create a booking.');
  }
  if (!Number.isFinite(durationHours) || durationHours < 1 || durationHours > 8) {
    throw new Error('Booking duration must be between 1 and 8 hours.');
  }
  if (data.safetyAcknowledged !== true) {
    throw new Error('Safety agreement must be acknowledged before creating a booking.');
  }
  const scheduledStart = data.scheduledStart || createScheduledStart(data.date, data.time);
  if (!Number.isFinite(new Date(scheduledStart).getTime())) {
    throw new Error('A valid scheduled start time is required to create a booking.');
  }
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!timeZone) throw new Error('The device time zone is unavailable; booking time cannot be verified.');
  const payload = {
    companionId: data.companionId,
    companionName: data.companionName,
    activityName,
    activityId: data.activityId,
    activityIcon: data.activityIcon,
    venueName,
    venueAddress: data.venueAddress,
    date: data.date,
    time: data.time,
    timeZone,
    scheduledStart,
    durationHours,
    safetyAcknowledged: data.safetyAcknowledged,
    specialInstructions: data.specialInstructions || data.notes,
  };
  const res = await apiClient.post<Booking>('/bookings', payload);
  return res.data;
};

const createScheduledStart = (date: string, time: string): string => {
  const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const timeMatch = time.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!dateMatch || !timeMatch) {
    throw new Error('Booking date and time must use a supported date and time format.');
  }
  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText, meridiem] = timeMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  let hour = Number(hourText);
  const minute = Number(minuteText);
  if (month < 1 || month > 12 || day < 1 || day > 31 || minute > 59) {
    throw new Error('Booking date and time are invalid.');
  }
  if (meridiem) {
    if (hour < 1 || hour > 12) throw new Error('Booking time is invalid.');
    if (meridiem.toUpperCase() === 'AM') hour = hour === 12 ? 0 : hour;
    else hour = hour === 12 ? 12 : hour + 12;
  } else if (hour > 23) {
    throw new Error('Booking time is invalid.');
  }
  const localStart = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (localStart.getFullYear() !== year || localStart.getMonth() !== month - 1 || localStart.getDate() !== day) {
    throw new Error('Booking date is invalid.');
  }
  return localStart.toISOString();
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
