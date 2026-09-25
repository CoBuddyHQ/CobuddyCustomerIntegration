import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import common from './locales/en/common.json';

import settingsHub from './locales/en/settings/hub.json';
import settingsAccountSettings from './locales/en/settings/accountSettings.json';
import settingsActiveSessions from './locales/en/settings/activeSessions.json';
import settingsAppLock from './locales/en/settings/appLock.json';
import settingsAppPermissions from './locales/en/settings/appPermissions.json';
import settingsBlockedUsers from './locales/en/settings/blockedUsers.json';
import settingsDataCache from './locales/en/settings/dataCache.json';
import settingsDeactivateAccount from './locales/en/settings/deactivateAccount.json';
import settingsDeleteAccount from './locales/en/settings/deleteAccount.json';
import settingsLanguageSelection from './locales/en/settings/languageSelection.json';
import settingsLegalAgreements from './locales/en/settings/legalAgreements.json';
import settingsNotificationPreferences from './locales/en/settings/notificationPreferences.json';
import settingsReferFriend from './locales/en/settings/referFriend.json';
import settingsSpokenLanguages from './locales/en/settings/spokenLanguages.json';

import supportCreateTicket from './locales/en/support/createTicket.json';
import supportHelpCenter from './locales/en/support/helpCenter.json';
import supportSupportCenter from './locales/en/support/supportCenter.json';
import supportTicketDetail from './locales/en/support/ticketDetail.json';

import verifyDocument from './locales/en/verify/document.json';
import verifyKycIntro from './locales/en/verify/kycIntro.json';
import verifyLiveness from './locales/en/verify/liveness.json';
import verifySelfie from './locales/en/verify/selfie.json';
import verifyPending from './locales/en/verify/pending.json';
import verifyProcessing from './locales/en/verify/processing.json';
import verifyRejected from './locales/en/verify/rejected.json';
import verifySuccess from './locales/en/verify/success.json';



import authPhone from './locales/en/auth/phone.json';
import authOtp from './locales/en/auth/otp.json';
import onboardingWelcome from './locales/en/onboarding/welcome.json';
import onboardingConsent from './locales/en/onboarding/consent.json';
import onboardingLocation from './locales/en/onboarding/location.json';
import onboardingNotification from './locales/en/onboarding/notification.json';
import onboardingProfile from './locales/en/onboarding/profile.json';
import onboardingInterests from './locales/en/onboarding/interests.json';
import onboardingSafety from './locales/en/onboarding/safety.json';
import onboardingContacts from './locales/en/onboarding/contacts.json';

// Main App Namespaces
import homeDashboard from './locales/en/home/dashboard.json';
import homeNotifications from './locales/en/home/notifications.json';
import homeDiscover from './locales/en/home/discover.json';
import homeCompanionProfile from './locales/en/home/companionProfile.json';

import bookingActivitySelect from './locales/en/booking/activitySelect.json';
import bookingSummary from './locales/en/booking/summary.json';
import bookingTimeSelect from './locales/en/booking/timeSelect.json';
import bookingVenueSelect from './locales/en/booking/venueSelect.json';
import bookingLocationSelection from './locales/en/booking/locationSelection.json';
import bookingAccepted from './locales/en/booking/accepted.json';
import bookingCounterOffer from './locales/en/booking/counterOffer.json';
import bookingDeclined from './locales/en/booking/declined.json';
import bookingRequestSent from './locales/en/booking/requestSent.json';

import bookingsList from './locales/en/bookings/list.json';
import bookingsDetail from './locales/en/bookings/detail.json';
import bookingsCancel from './locales/en/bookings/cancel.json';
import bookingsDispute from './locales/en/bookings/dispute.json';
import bookingsModify from './locales/en/bookings/modify.json';

import sessionActive from './locales/en/session/active.json';
import sessionArrival from './locales/en/session/arrival.json';
import sessionCompanionReview from './locales/en/session/companionReview.json';
import sessionPostFeedback from './locales/en/session/postFeedback.json';
import sessionComplete from './locales/en/session/complete.json';
import sessionReminder from './locales/en/session/reminder.json';
import sessionTip from './locales/en/session/tip.json';

import chatList from './locales/en/chat/list.json';
import chatCompanion from './locales/en/chat/companion.json';
import chatConcierge from './locales/en/chat/concierge.json';
import chatIncomingCall from './locales/en/chat/incomingCall.json';
import chatVoiceCall from './locales/en/chat/voiceCall.json';

import safetyReport from './locales/en/safety/report.json';
import safetyGuidelines from './locales/en/safety/guidelines.json';
import safetyHub from './locales/en/safety/hub.json';
import safetySettings from './locales/en/safety/settings.json';

import systemDeactivated from './locales/en/system/deactivated.json';
import systemReactivationReq from './locales/en/system/reactivationReq.json';
import systemSuspended from './locales/en/system/suspended.json';
import systemManualReview from './locales/en/system/manualReview.json';
import systemForceUpdate from './locales/en/system/forceUpdate.json';
import systemMaintenance from './locales/en/system/maintenance.json';
import systemNetworkError from './locales/en/system/networkError.json';
import systemPolicyViolation from './locales/en/system/policyViolation.json';

import profileEdit from './locales/en/profile/edit.json';
import profileReviews from './locales/en/profile/reviews.json';
import profileMain from './locales/en/profile/main.json';
import profileSaved from './locales/en/profile/saved.json';

// Wallet Module
import walletWallet from './locales/en/wallet/wallet.json';
import walletTransactionDetail from './locales/en/wallet/transactionDetail.json';
import walletTransactionHistory from './locales/en/wallet/transactionHistory.json';
import walletPaymentMethods from './locales/en/wallet/paymentMethods.json';
import walletAddPaymentMethod from './locales/en/wallet/addPaymentMethod.json';
import walletAddBankAccount from './locales/en/wallet/addBankAccount.json';
import walletAddMoney from './locales/en/wallet/addMoney.json';
import walletWithdrawMoney from './locales/en/wallet/withdrawMoney.json';
import walletWithdrawalMethods from './locales/en/wallet/withdrawalMethods.json';

const resources = {
  en: {
    common,
    auth: {
      phone: authPhone,
      otp: authOtp
    },
    onboarding: {
      welcome: onboardingWelcome,
      consent: onboardingConsent,
      location: onboardingLocation,
      notification: onboardingNotification,
      profile: onboardingProfile,
      interests: onboardingInterests,
      safety: onboardingSafety,
      contacts: onboardingContacts
    },
    'home.dashboard': homeDashboard,
    'home.notifications': homeNotifications,
    'discover': homeDiscover,
    'companionProfile': homeCompanionProfile,
    'booking.activitySelect': bookingActivitySelect,
    'booking.summary': bookingSummary,
    'booking.timeSelect': bookingTimeSelect,
    'booking.venueSelect': bookingVenueSelect,
    'booking.locationSelection': bookingLocationSelection,
    'booking.accepted': bookingAccepted,
    'booking.counterOffer': bookingCounterOffer,
    'booking.declined': bookingDeclined,
    'booking.requestSent': bookingRequestSent,
    'bookings.list': bookingsList,
    'bookings.detail': bookingsDetail,
    'bookings.cancel': bookingsCancel,
    'bookings.dispute': bookingsDispute,
    'bookings.modify': bookingsModify,
    'session.active': sessionActive,
    'session.arrival': sessionArrival,
    'session.companionReview': sessionCompanionReview,
    'session.postFeedback': sessionPostFeedback,
    'session.complete': sessionComplete,
    'session.reminder': sessionReminder,
    'session.tip': sessionTip,
    'chat.list': chatList,
    'chat.companion': chatCompanion,
    'chat.concierge': chatConcierge,
    'chat.incomingCall': chatIncomingCall,
    'chat.voiceCall': chatVoiceCall,
    'safety.report': safetyReport,
    'safety.guidelines': safetyGuidelines,
    'safety.hub': safetyHub,
    'safety.settings': safetySettings,
    'profile.edit': profileEdit,
    'profile.reviews': profileReviews,
    'profile.main': profileMain,
    'profile.saved': profileSaved,
    'system.deactivated': systemDeactivated,
    'system.reactivationReq': systemReactivationReq,
    'system.suspended': systemSuspended,
    'system.manualReview': systemManualReview,
    'system.forceUpdate': systemForceUpdate,
    'system.maintenance': systemMaintenance,
    'system.networkError': systemNetworkError,
    'system.policyViolation': systemPolicyViolation,
    'wallet.wallet': walletWallet,
    'wallet.transactionDetail': walletTransactionDetail,
    'wallet.transactionHistory': walletTransactionHistory,
    'wallet.paymentMethods': walletPaymentMethods,
    'wallet.addPaymentMethod': walletAddPaymentMethod,
    'wallet.addBankAccount': walletAddBankAccount,
    'wallet.addMoney': walletAddMoney,
    'wallet.withdrawMoney': walletWithdrawMoney,
    'wallet.withdrawalMethods': walletWithdrawalMethods,
    'verify.document': verifyDocument,
    'verify.kycIntro': verifyKycIntro,
    'verify.liveness': verifyLiveness,
    'verify.selfie': verifySelfie,
    'verify.pending': verifyPending,
    'verify.processing': verifyProcessing,
    'verify.rejected': verifyRejected,
    'verify.success': verifySuccess,
    'support.createTicket': supportCreateTicket,
    'support.helpCenter': supportHelpCenter,
    'support.supportCenter': supportSupportCenter,
    'support.ticketDetail': supportTicketDetail,
    'settings.hub': settingsHub,
    'settings.accountSettings': settingsAccountSettings,
    'settings.activeSessions': settingsActiveSessions,
    'settings.appLock': settingsAppLock,
    'settings.appPermissions': settingsAppPermissions,
    'settings.blockedUsers': settingsBlockedUsers,
    'settings.dataCache': settingsDataCache,
    'settings.deactivateAccount': settingsDeactivateAccount,
    'settings.deleteAccount': settingsDeleteAccount,
    'settings.languageSelection': settingsLanguageSelection,
    'settings.legalAgreements': settingsLegalAgreements,
    'settings.notificationPreferences': settingsNotificationPreferences,
    'settings.referFriend': settingsReferFriend,
    'settings.spokenLanguages': settingsSpokenLanguages
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: [
    'common',
    'auth',
    'onboarding',
    'home.dashboard',
    'home.notifications',
    'discover',
    'companionProfile',
    'booking.activitySelect',
    'booking.summary',
    'booking.timeSelect',
    'booking.venueSelect',
    'booking.locationSelection',
    'booking.accepted',
    'booking.counterOffer',
    'booking.declined',
    'booking.requestSent',
    'bookings.list',
    'bookings.detail',
    'bookings.cancel',
    'bookings.dispute',
    'bookings.modify',
    'session.active',
    'session.arrival',
    'session.companionReview',
    'session.postFeedback',
    'session.complete',
    'session.reminder',
    'session.tip',
    'chat.list',
    'chat.companion',
    'chat.concierge',
    'chat.incomingCall',
    'chat.voiceCall',
    'safety.report',
    'safety.guidelines',
    'safety.hub',
    'safety.settings',
    'profile.edit',
    'profile.reviews',
    'profile.main',
    'profile.saved',
    'system.deactivated',
    'system.reactivationReq',
    'system.suspended',
    'system.manualReview',
    'system.forceUpdate',
    'system.maintenance',
    'system.networkError',
    'system.policyViolation',
    'wallet.wallet',
    'wallet.transactionDetail',
    'wallet.transactionHistory',
    'wallet.paymentMethods',
    'wallet.addPaymentMethod',
    'wallet.addBankAccount',
    'wallet.addMoney',
    'wallet.withdrawMoney',
    'wallet.withdrawalMethods',
    'verify.document',
    'verify.kycIntro',
    'verify.liveness',
    'verify.selfie',
    'verify.pending',
    'verify.processing',
    'verify.rejected',
    'verify.success',
    'support.createTicket',
    'support.helpCenter',
    'support.supportCenter',
    'support.ticketDetail',
    'settings.hub',
    'settings.accountSettings',
    'settings.activeSessions',
    'settings.appLock',
    'settings.appPermissions',
    'settings.blockedUsers',
    'settings.dataCache',
    'settings.deactivateAccount',
    'settings.deleteAccount',
    'settings.languageSelection',
    'settings.legalAgreements',
    'settings.notificationPreferences',
    'settings.referFriend',
    'settings.spokenLanguages'
  ],
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
