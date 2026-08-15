/**
 * CoBuddy Customer — Auth Store (Zustand)
 *
 * Responsibilities:
 *  - Manage authentication state (token, user, isAuthenticated)
 *  - Persist tokens via AsyncStorage through TokenStorage helpers
 *  - Call real backend API for send-otp, verify-otp, resend-otp, logout
 *  - Restore session on app boot via rehydrate()
 *  - Wire setLogoutListener so 401-refresh-failure auto-triggers logout
 */

import { create } from 'zustand';
import { authApi, TokenStorage, setLogoutListener } from '../services/api';
import type { CustomerFromAuth } from '../services/api';

export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface AuthUser {
  id: string;
  phone: string;
  name?: string | null;
  avatar?: string | null;
  bio?: string | null;
  age?: number | null;
  gender?: string | null;
  city?: string | null;
  accountStatus?: string;
  kycStatus?: string;
}

export interface AuthState {
  // ─── State ─────────────────────────────────────────────────────────────────
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  kycStatus: KycStatus;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;

  // ─── Sync actions (used internally & by apiClient logout listener) ─────────
  _setAuth: (token: string, user: AuthUser) => void;
  _clearAuth: () => void;

  // ─── Async API actions ─────────────────────────────────────────────────────

  /**
   * Send OTP to phone number via backend.
   * Returns devOtp in development mode.
   */
  sendOtp: (phone: string) => Promise<{ devOtp?: string }>;

  /**
   * Verify OTP. On success: stores tokens in AsyncStorage, updates store state.
   * Returns isNewCustomer flag to navigate to onboarding or home.
   */
  verifyOtp: (phone: string, otp: string) => Promise<{ isNewCustomer: boolean }>;

  /**
   * Resend OTP — proxy to backend resend endpoint.
   */
  resendOtp: (phone: string) => Promise<void>;

  /**
   * Logout current device. Clears AsyncStorage and resets store.
   */
  logout: () => Promise<void>;

  /**
   * Restore session from AsyncStorage on app boot.
   * Called once from RootNavigator on mount.
   */
  rehydrate: () => Promise<void>;

  /**
   * Mark onboarding as complete (after BasicProfileSetupScreen save).
   */
  completeOnboarding: () => void;

  /**
   * Update KYC status in store (called after kyc.api calls).
   */
  setKycStatus: (status: KycStatus) => void;

  /**
   * Update user fields in store without a full auth cycle
   * (e.g., after profile edit).
   */
  updateUser: (updates: Partial<AuthUser>) => void;

  /** Clear any API error */
  clearError: () => void;
}

// ─── Helper: map backend customer to our AuthUser ────────────────────────────
const mapCustomer = (c: CustomerFromAuth): AuthUser => ({
  id: c.id,
  phone: c.phone,
  name: c.name ?? null,
  avatar: c.avatar ?? null,
  bio: c.bio ?? null,
  age: c.age ?? null,
  gender: c.gender ?? null,
  city: c.city ?? null,
  accountStatus: c.accountStatus,
  kycStatus: c.kycStatus,
});

const toKycStatus = (raw?: string): KycStatus => {
  if (raw === 'approved') return 'verified';
  if (raw === 'pending' || raw === 'processing') return 'pending';
  if (raw === 'rejected') return 'rejected';
  return 'unverified';
};

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>((set, get) => {

  // Wire the 401-refresh-failure listener so apiClient can force logout
  setLogoutListener(() => {
    get()._clearAuth();
  });

  return {
    // ─── Initial state ───────────────────────────────────────────────────────
    user: null,
    token: null,
    isAuthenticated: false,
    isOnboardingComplete: false,
    kycStatus: 'unverified',
    isLoading: false,
    error: null,
    isHydrated: false,

    // ─── Sync setters ────────────────────────────────────────────────────────
    _setAuth: (token, user) => set({
      token,
      user,
      isAuthenticated: true,
    }),

    _clearAuth: () => set({
      token: null,
      user: null,
      isAuthenticated: false,
      isOnboardingComplete: false,
      kycStatus: 'unverified',
      error: null,
    }),

    // ─── sendOtp ─────────────────────────────────────────────────────────────
    sendOtp: async (phone) => {
      set({ isLoading: true, error: null });
      try {
        const res = await authApi.sendOtp({ phone });
        return { devOtp: res.devOtp };
      } catch (e: any) {
        const msg = e?.response?.data?.message ?? 'Failed to send OTP.';
        const errMsg = Array.isArray(msg) ? msg[0] : msg;
        set({ error: errMsg });
        throw e;
      } finally {
        set({ isLoading: false });
      }
    },

    // ─── verifyOtp ───────────────────────────────────────────────────────────
    verifyOtp: async (phone, otp) => {
      set({ isLoading: true, error: null });
      try {
        const res = await authApi.verifyOtp({ phone, otp });
        const user = mapCustomer(res.customer);

        // Persist tokens
        await TokenStorage.setTokens(res.accessToken, res.refreshToken);
        await TokenStorage.setUser(user);

        set({
          token: res.accessToken,
          user,
          isAuthenticated: true,
          isOnboardingComplete: res.customer.onboardingComplete,
          kycStatus: toKycStatus(res.customer.kycStatus),
        });

        return { isNewCustomer: res.isNewCustomer };
      } catch (e: any) {
        const data = e?.response?.data;
        let msg = 'Invalid OTP. Please try again.';
        if (data?.message) {
          msg = Array.isArray(data.message) ? data.message[0] : data.message;
        }
        set({ error: msg });
        throw e;
      } finally {
        set({ isLoading: false });
      }
    },

    // ─── resendOtp ───────────────────────────────────────────────────────────
    resendOtp: async (phone) => {
      set({ isLoading: true, error: null });
      try {
        await authApi.resendOtp(phone);
      } catch (e: any) {
        const msg = e?.response?.data?.message ?? 'Failed to resend OTP.';
        set({ error: Array.isArray(msg) ? msg[0] : msg });
        throw e;
      } finally {
        set({ isLoading: false });
      }
    },

    // ─── logout ──────────────────────────────────────────────────────────────
    logout: async () => {
      set({ isLoading: true });
      try {
        const refreshToken = await TokenStorage.getRefreshToken();
        await authApi.logout(refreshToken ?? undefined);
      } catch {
        // Best-effort — always clear local state even if backend call fails
      } finally {
        await TokenStorage.clearAll();
        get()._clearAuth();
        set({ isLoading: false });
      }
    },

    // ─── rehydrate (boot session restore) ────────────────────────────────────
    rehydrate: async () => {
      try {
        const token = await TokenStorage.getAccessToken();
        const user = await TokenStorage.getUser<AuthUser>();

        if (token && user) {
          // Try to validate session via /auth/me
          const freshCustomer = await authApi.getMe();
          const freshUser = mapCustomer(freshCustomer);
          await TokenStorage.setUser(freshUser);

          set({
            token,
            user: freshUser,
            isAuthenticated: true,
            isOnboardingComplete: freshCustomer.onboardingComplete,
            kycStatus: toKycStatus(freshCustomer.kycStatus),
            isHydrated: true,
          });
        } else {
          set({ isHydrated: true });
        }
      } catch {
        // Token invalid or network error — clear and show login
        await TokenStorage.clearAll();
        set({ isAuthenticated: false, isHydrated: true });
      }
    },

    // ─── completeOnboarding ───────────────────────────────────────────────────
    completeOnboarding: () => set({ isOnboardingComplete: true }),

    // ─── setKycStatus ─────────────────────────────────────────────────────────
    setKycStatus: (status) => set({ kycStatus: status }),

    // ─── updateUser ───────────────────────────────────────────────────────────
    updateUser: (updates) => set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

    // ─── clearError ───────────────────────────────────────────────────────────
    clearError: () => set({ error: null }),
  };
});
