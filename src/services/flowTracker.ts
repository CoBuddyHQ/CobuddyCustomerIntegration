/**
 * CoBuddy Customer — Production Flow Tracker & Reconciliation System
 *
 * Implements 3-Level State Management:
 *  - Level 1: UI Component State (forms, inputs, animations)
 *  - Level 2: Local Persistence (AsyncStorage - flow caching, active screen)
 *  - Level 3: Backend Authoritative State (the single source of truth)
 *
 * Rule: Backend state ALWAYS wins on conflict.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileApi, kycApi } from './api';
import { useAuthStore } from '../store/slices/authStore';

export type FlowType = 'ONBOARDING' | 'KYC' | 'BOOKING' | 'SESSION' | 'PAYMENT';

export interface FlowState {
  flowType: FlowType;
  currentStep: string;
  completedSteps: string[];
  lastAttemptedStep?: string;
  lastSuccessfulStep?: string;
  lastUpdatedAt: string;
}

const FLOW_TRACKER_PREFIX = 'cb_flow_state_';
const ACTIVE_SCREEN_KEY = 'cb_active_screen';

export const FlowTracker = {
  /**
   * Log flow action in development
   */
  log(flow: FlowType, screen: string, action: string, status: 'START' | 'SUCCESS' | 'FAILURE', details?: any) {
    if (__DEV__) {
      console.log(`[FlowTracker:${flow}] ${screen} → ${action} [${status}]`, details ?? '');
    }
  },

  /**
   * Save currently active screen so reload stays on exact screen
   */
  async saveActiveScreen(screenName: string): Promise<void> {
    try {
      await AsyncStorage.setItem(ACTIVE_SCREEN_KEY, screenName);
    } catch {
      // Non-critical
    }
  },

  /**
   * Get last active screen before reload
   */
  async getActiveScreen(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACTIVE_SCREEN_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Level 2 Local Persistence: Save cached flow state
   */
  async saveFlowState(customerId: string, flowState: FlowState): Promise<void> {
    try {
      const key = `${FLOW_TRACKER_PREFIX}${customerId}_${flowState.flowType}`;
      await AsyncStorage.setItem(key, JSON.stringify(flowState));
    } catch {
      // Non-critical local caching failure
    }
  },

  /**
   * Level 2 Local Persistence: Get cached flow state
   */
  async getFlowState(customerId: string, flowType: FlowType): Promise<FlowState | null> {
    try {
      const key = `${FLOW_TRACKER_PREFIX}${customerId}_${flowType}`;
      const raw = await AsyncStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Clear flow tracker for account logout/switching
   */
  async clearAccountFlows(customerId: string): Promise<void> {
    try {
      const flows: FlowType[] = ['ONBOARDING', 'KYC', 'BOOKING', 'SESSION', 'PAYMENT'];
      const keys = flows.map((f) => `${FLOW_TRACKER_PREFIX}${customerId}_${f}`);
      keys.push(ACTIVE_SCREEN_KEY);
      await Promise.all(keys.map((k) => AsyncStorage.removeItem(k)));
    } catch {
      // Best-effort
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 3: AUTHORITATIVE RECONCILIATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Reconcile Onboarding flow against backend authoritative state.
   * Returns exact next screen to render.
   */
  async reconcileOnboarding(): Promise<{
    screenName: 'LegalConsentScreen' | 'LocationPermissionScreen' | 'NotificationPermissionScreen' | 'BasicProfileSetupScreen' | 'InterestSelectionScreen' | 'SafetyTutorialScreen' | 'TrustedContactsScreen' | 'MainTabNavigator';
    isOnboardingComplete: boolean;
    completedSteps: string[];
    currentStep: string;
  }> {
    try {
      // Check if user was already on an active screen in this session
      const lastScreen = await this.getActiveScreen();

      const progress = await profileApi.getOnboardingProgress();
      const authStore = useAuthStore.getState();

      if (progress.isOnboardingComplete) {
        if (!authStore.isOnboardingComplete) {
          authStore.updateUser({ ...progress.customer });
        }
        return {
          screenName: 'MainTabNavigator',
          isOnboardingComplete: true,
          completedSteps: progress.completedSteps || [],
          currentStep: 'completed',
        };
      }

      const completed = progress.completedSteps || [];
      const backendStep = progress.currentStep || 'legal_consent';

      // Step mapping from backend step string to screen name
      const stepToScreen: Record<string, 'LegalConsentScreen' | 'LocationPermissionScreen' | 'NotificationPermissionScreen' | 'BasicProfileSetupScreen' | 'InterestSelectionScreen' | 'SafetyTutorialScreen' | 'TrustedContactsScreen'> = {
        'legal_consent': 'LegalConsentScreen',
        'location': 'LocationPermissionScreen',
        'notification': 'NotificationPermissionScreen',
        'profile_setup': 'BasicProfileSetupScreen',
        'interests': 'InterestSelectionScreen',
        'safety_tutorial': 'SafetyTutorialScreen',
        'trusted_contacts': 'TrustedContactsScreen',
      };

      let targetScreen = stepToScreen[backendStep] || 'LegalConsentScreen';

      // If user had a last active screen and it's valid for current progress, stay on it!
      const validOnboardingScreens = [
        'LegalConsentScreen',
        'LocationPermissionScreen',
        'NotificationPermissionScreen',
        'BasicProfileSetupScreen',
        'InterestSelectionScreen',
        'SafetyTutorialScreen',
        'TrustedContactsScreen',
      ];
      if (lastScreen && validOnboardingScreens.includes(lastScreen)) {
        targetScreen = lastScreen as any;
      }

      this.log('ONBOARDING', targetScreen, 'reconcileOnboarding', 'SUCCESS', { completed, backendStep, lastScreen });

      return {
        screenName: targetScreen,
        isOnboardingComplete: false,
        completedSteps: completed,
        currentStep: backendStep,
      };
    } catch (e) {
      this.log('ONBOARDING', 'LegalConsentScreen', 'reconcileOnboarding', 'FAILURE', e);
      return {
        screenName: 'LegalConsentScreen',
        isOnboardingComplete: false,
        completedSteps: [],
        currentStep: 'legal_consent',
      };
    }
  },

  /**
   * Reconcile KYC flow against backend authoritative state.
   * Returns exact KYC screen to render.
   */
  async reconcileKyc(): Promise<{
    screenName: 'KYCIntroScreen' | 'DocumentVerificationScreen' | 'SelfieCaptureScreen' | 'LivenessDetectionScreen' | 'VerificationPendingScreen' | 'VerificationSuccessScreen' | 'VerificationRejectedScreen';
    status: string;
    currentStep: string;
    documentSubmitted: boolean;
    selfieSubmitted: boolean;
    livenessSubmitted: boolean;
  }> {
    try {
      const lastScreen = await this.getActiveScreen();
      const kycData = await kycApi.getKycStatus();
      const status = (kycData as any).status || 'unverified';
      const documentSubmitted = Boolean((kycData as any).documentSubmitted || (kycData as any).kyc?.docNumber || (kycData as any).kyc?.frontDocUrl);
      const selfieSubmitted = Boolean((kycData as any).selfieSubmitted || (kycData as any).kyc?.selfieUrl);
      const livenessSubmitted = Boolean((kycData as any).livenessSubmitted || (kycData as any).kyc?.livenessUrl);

      let screenName: 'KYCIntroScreen' | 'DocumentVerificationScreen' | 'SelfieCaptureScreen' | 'LivenessDetectionScreen' | 'VerificationPendingScreen' | 'VerificationSuccessScreen' | 'VerificationRejectedScreen' = 'KYCIntroScreen';

      if (status === 'verified' || status === 'approved') {
        screenName = 'VerificationSuccessScreen';
      } else if (status === 'rejected') {
        screenName = 'VerificationRejectedScreen';
      } else if (!documentSubmitted) {
        screenName = 'DocumentVerificationScreen';
      } else if (!selfieSubmitted) {
        screenName = 'SelfieCaptureScreen';
      } else if (!livenessSubmitted) {
        screenName = 'LivenessDetectionScreen';
      } else {
        screenName = 'VerificationPendingScreen';
      }

      const validKycScreens = [
        'KYCIntroScreen',
        'DocumentVerificationScreen',
        'SelfieCaptureScreen',
        'LivenessDetectionScreen',
        'VerificationPendingScreen',
        'VerificationSuccessScreen',
        'VerificationRejectedScreen',
      ];
      if (lastScreen && validKycScreens.includes(lastScreen)) {
        screenName = lastScreen as any;
      }

      this.log('KYC', screenName, 'reconcileKyc', 'SUCCESS', { status, documentSubmitted, selfieSubmitted, livenessSubmitted, lastScreen });

      return {
        screenName,
        status,
        currentStep: (kycData as any).currentStep || screenName,
        documentSubmitted,
        selfieSubmitted,
        livenessSubmitted,
      };
    } catch (e) {
      this.log('KYC', 'KYCIntroScreen', 'reconcileKyc', 'FAILURE', e);
      return {
        screenName: 'KYCIntroScreen',
        status: 'unverified',
        currentStep: 'DOCUMENT',
        documentSubmitted: false,
        selfieSubmitted: false,
        livenessSubmitted: false,
      };
    }
  },
};
