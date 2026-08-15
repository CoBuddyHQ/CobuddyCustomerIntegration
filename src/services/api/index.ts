/**
 * CoBuddy Customer — API Services Barrel Export
 * Import everything from here: import { authApi, profileApi } from '@/services/api'
 */

export * as authApi from './auth.api';
export * as profileApi from './profile.api';
export * as discoveryApi from './discovery.api';
export * as bookingApi from './booking.api';
export * as sessionApi from './session.api';
export * as walletApi from './wallet.api';
export * as safetyApi from './safety.api';
export * as supportApi from './support.api';
export * as notificationsApi from './notifications.api';
export * as chatApi from './chat.api';
export * as kycApi from './kyc.api';
export * as paymentApi from './payment.api';
export * as reviewsApi from './reviews.api';
export * as accountApi from './account.api';

export { default as apiClient, getApiError, TokenStorage, setLogoutListener, BASE_URL } from './apiClient';

// Re-export key types for convenience
export type { CustomerFromAuth, VerifyOtpResponse } from './auth.api';
export type { CustomerProfile, UpdateProfileRequest } from './profile.api';
export type { CompanionCard, CompanionDetail, CompanionFilterParams } from './discovery.api';
export type { Booking, CreateBookingRequest, BookingStatus } from './booking.api';
export type { Session, SessionPass } from './session.api';
export type { WalletBalance, Transaction, PaymentMethod } from './wallet.api';
export type { TrustedContact, SOSEvent, IncidentReport } from './safety.api';
export type { SupportTicket, TicketMessage, FAQ } from './support.api';
export type { Notification } from './notifications.api';
export type { Conversation, ChatMessage } from './chat.api';
export type { KycStatus } from './kyc.api';
export type { RazorpayOrder } from './payment.api';
export type { Review, CreateReviewRequest } from './reviews.api';
export type { AccountSettings, ActiveSession, NotificationPreferences } from './account.api';
