import { FlowTracker } from '../services/flowTracker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileApi, kycApi } from '../services/api';

jest.mock('../services/api', () => ({
  profileApi: {
    getOnboardingProgress: jest.fn(),
  },
  kycApi: {
    getKycStatus: jest.fn(),
  },
  setLogoutListener: jest.fn(),
  TokenStorage: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    saveTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));
describe('FlowTracker Unit Tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('reconcileOnboarding', () => {
    it('returns MainTabNavigator when onboarding is completed on backend', async () => {
      (profileApi.getOnboardingProgress as jest.Mock).mockResolvedValueOnce({
        isOnboardingComplete: true,
        completedSteps: ['legal_consent', 'location', 'profile_setup'],
        customer: { id: 'cust-1' },
      });

      const result = await FlowTracker.reconcileOnboarding();
      expect(result.screenName).toBe('MainTabNavigator');
      expect(result.isOnboardingComplete).toBe(true);
      expect(result.currentStep).toBe('completed');
    });

    it('returns authoritative backend step and does not regress to earlier step stored in activeScreen', async () => {
      // User was previously on legal consent locally, but backend says they advanced to profile_setup
      await AsyncStorage.setItem('cb_active_screen', 'LegalConsentScreen');

      (profileApi.getOnboardingProgress as jest.Mock).mockResolvedValueOnce({
        isOnboardingComplete: false,
        currentStep: 'profile_setup',
        completedSteps: ['legal_consent', 'location', 'notification'],
      });

      const result = await FlowTracker.reconcileOnboarding();
      // Must NOT be LegalConsentScreen (the stale local state)
      expect(result.screenName).toBe('BasicProfileSetupScreen');
      expect(result.isOnboardingComplete).toBe(false);
      expect(result.currentStep).toBe('profile_setup');
    });

    it('respects lastScreen only if it matches current backend authoritative step', async () => {
      await AsyncStorage.setItem('cb_active_screen', 'BasicProfileSetupScreen');

      (profileApi.getOnboardingProgress as jest.Mock).mockResolvedValueOnce({
        isOnboardingComplete: false,
        currentStep: 'profile_setup',
        completedSteps: ['legal_consent', 'location', 'notification'],
      });

      const result = await FlowTracker.reconcileOnboarding();
      expect(result.screenName).toBe('BasicProfileSetupScreen');
    });
  });

  describe('reconcileKyc', () => {
    it('returns VerificationSuccessScreen when backend status is approved or verified', async () => {
      (kycApi.getKycStatus as jest.Mock).mockResolvedValueOnce({
        status: 'approved',
        documentSubmitted: true,
        selfieSubmitted: true,
        livenessSubmitted: true,
      });

      const result = await FlowTracker.reconcileKyc();
      expect(result.screenName).toBe('VerificationSuccessScreen');
      expect(result.status).toBe('approved');
    });

    it('advances to SelfieCaptureScreen once document is submitted and prevents local activeScreen from repeating DocumentVerificationScreen', async () => {
      // Local storage still says DocumentVerificationScreen
      await AsyncStorage.setItem('cb_active_screen', 'DocumentVerificationScreen');

      (kycApi.getKycStatus as jest.Mock).mockResolvedValueOnce({
        status: 'in_progress',
        documentSubmitted: true,
        selfieSubmitted: false,
        livenessSubmitted: false,
      });

      const result = await FlowTracker.reconcileKyc();
      // Must advance to SelfieCaptureScreen, NOT stay at DocumentVerificationScreen
      expect(result.screenName).toBe('SelfieCaptureScreen');
      expect(result.documentSubmitted).toBe(true);
      expect(result.selfieSubmitted).toBe(false);
    });

    it('advances to VerificationPendingScreen when all documents and selfies are submitted', async () => {
      await AsyncStorage.setItem('cb_active_screen', 'SelfieCaptureScreen');

      (kycApi.getKycStatus as jest.Mock).mockResolvedValueOnce({
        status: 'in_review',
        documentSubmitted: true,
        selfieSubmitted: true,
        livenessSubmitted: true,
      });

      const result = await FlowTracker.reconcileKyc();
      expect(result.screenName).toBe('VerificationPendingScreen');
    });
  });
});
