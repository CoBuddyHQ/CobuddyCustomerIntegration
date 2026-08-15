/**
 * CoBuddy Customer — API Services Barrel Export
 * Import everything from here: import { authApi, profileApi } from '@/services/api'
 */

import * as authApi from './auth.api';
import * as profileApi from './profile.api';
import * as discoveryApi from './discovery.api';
import * as bookingApi from './booking.api';
import * as sessionApi from './session.api';
import * as walletApi from './wallet.api';
import * as safetyApi from './safety.api';
import * as supportApi from './support.api';
import * as notificationsApi from './notifications.api';
import * as chatApi from './chat.api';
import * as kycApi from './kyc.api';
import * as paymentApi from './payment.api';
import * as reviewsApi from './reviews.api';
import * as accountApi from './account.api';

export {
  authApi,
  profileApi,
  discoveryApi,
  bookingApi,
  sessionApi,
  walletApi,
  safetyApi,
  supportApi,
  notificationsApi,
  chatApi,
  kycApi,
  paymentApi,
  reviewsApi,
  accountApi,
};

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
