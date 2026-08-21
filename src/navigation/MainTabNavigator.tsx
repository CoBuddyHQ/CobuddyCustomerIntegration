import React from 'react';
import { useTranslation } from 'react-i18next';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RouteProp, ParamListBase } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeDashboardScreen } from '../screens/home/HomeDashboardScreen';
import { DiscoverScreen } from '../screens/home/DiscoverScreen';
import { CompanionProfileScreen } from '../screens/home/CompanionProfileScreen';
import { BookingsListScreen } from '../screens/bookings/BookingsListScreen';
import { BookingDetailScreen } from '../screens/bookings/BookingDetailScreen';
import { CancelBookingScreen } from '../screens/bookings/CancelBookingScreen';
import { ModifyBookingScreen } from '../screens/bookings/ModifyBookingScreen';
import { DisputeRefundScreen } from '../screens/bookings/DisputeRefundScreen';
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { ConciergeChatScreen } from '../screens/chat/ConciergeChatScreen';
import { CompanionChatScreen } from '../screens/chat/CompanionChatScreen';
import { VoiceCallScreen } from '../screens/chat/VoiceCallScreen';
import { IncomingCallScreen } from '../screens/chat/IncomingCallScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { MyReviewsScreen } from '../screens/profile/MyReviewsScreen';
import { WalletScreen } from '../screens/wallet/WalletScreen';
import { TransactionHistoryScreen } from '../screens/wallet/TransactionHistoryScreen';
import { TransactionDetailScreen } from '../screens/wallet/TransactionDetailScreen';
import { PaymentMethodsScreen } from '../screens/wallet/PaymentMethodsScreen';
import { AddPaymentMethodScreen } from '../screens/wallet/AddPaymentMethodScreen';
import { AddMoneyScreen } from '../screens/wallet/AddMoneyScreen';
import { WithdrawMoneyScreen } from '../screens/wallet/WithdrawMoneyScreen';
import { WithdrawalMethodsScreen } from '../screens/wallet/WithdrawalMethodsScreen';
import { AddBankAccountScreen } from '../screens/wallet/AddBankAccountScreen';
import { SettingsHubScreen } from '../screens/settings/SettingsHubScreen';
import { NotificationPreferencesScreen } from '../screens/settings/NotificationPreferencesScreen';
import { LanguageSelectionScreen } from '../screens/settings/LanguageSelectionScreen';
import { AccountSettingsScreen } from '../screens/settings/AccountSettingsScreen';
import { ChangeMobileNumberScreen } from '../screens/settings/ChangeMobileNumberScreen';
import { DeleteAccountScreen } from '../screens/settings/DeleteAccountScreen';
import { LegalAgreementsScreen } from '../screens/settings/LegalAgreementsScreen';
import { InterestSelectionScreen } from '../screens/onboarding/InterestSelectionScreen';
import { SpokenLanguagesScreen } from '../screens/settings/SpokenLanguagesScreen';
import { LocationSelectionScreen } from '../screens/booking/LocationSelectionScreen';
import { AppPermissionsScreen } from '../screens/settings/AppPermissionsScreen';
import { AppLockScreen } from '../screens/settings/AppLockScreen';
import { BlockedUsersScreen } from '../screens/settings/BlockedUsersScreen';
import { SafetySettingsScreen } from '../screens/safety/SafetySettingsScreen';
import { DataCacheScreen } from '../screens/settings/DataCacheScreen';
import { OTPVerificationScreen } from '../screens/auth/OTPVerificationScreen';
import { DeactivateAccountScreen } from '../screens/settings/DeactivateAccountScreen';
import { ActiveSessionsScreen } from '../screens/settings/ActiveSessionsScreen';
import { SavedProfilesScreen } from '../screens/profile/SavedProfilesScreen';
import { ReferFriendScreen } from '../screens/settings/ReferFriendScreen';
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

import { NotificationsScreen } from '../screens/home/NotificationsScreen';
import { MOCK_CHAT_LIST } from '../services/mock';
const unreadCount = MOCK_CHAT_LIST.reduce((sum, c) => sum + (c.unread || 0), 0);

const HomeTabStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeDashboardScreen" component={HomeDashboardScreen} />
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />

      {/*
        NOTE: CompanionProfileScreen is intentionally dual-registered here (same pattern as
        OTPVerificationScreen below in ProfileTabStack). It has no single "home" tab — it can be
        opened from Home, Chat, Bookings, SavedProfiles and Discover itself. Registering it locally
        in every tab that can open it lets it push onto the CURRENT tab's stack instead of jumping
        to DiscoverTab. Callers should navigate('CompanionProfileScreen', { companionId }) directly,
        never navigate('DiscoverTab', { screen: 'CompanionProfileScreen', ... }).
      */}
      <Stack.Screen name="CompanionProfileScreen" component={CompanionProfileScreen} />
  </Stack.Navigator>
);

const DiscoverTabStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DiscoverScreen" component={DiscoverScreen} />
      <Stack.Screen name="CompanionProfileScreen" component={CompanionProfileScreen} />
  </Stack.Navigator>
);

const BookingsTabStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BookingsListScreen" component={BookingsListScreen} />
      <Stack.Screen name="BookingDetailScreen" component={BookingDetailScreen} />
      <Stack.Screen name="CancelBookingScreen" component={CancelBookingScreen} />
      <Stack.Screen name="ModifyBookingScreen" component={ModifyBookingScreen} />
      <Stack.Screen name="DisputeRefundScreen" component={DisputeRefundScreen} />

      {/* See note in HomeTabStack — CompanionProfileScreen dual-registration pattern. */}
      <Stack.Screen name="CompanionProfileScreen" component={CompanionProfileScreen} />
  </Stack.Navigator>
);

const ChatTabStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatListScreen" component={ChatListScreen} />
      <Stack.Screen name="ConciergeChatScreen" component={ConciergeChatScreen} />
      <Stack.Screen name="CompanionChatScreen" component={CompanionChatScreen} />
      <Stack.Screen name="VoiceCallScreen" component={VoiceCallScreen} />
      <Stack.Screen name="IncomingCallScreen" component={IncomingCallScreen} />

      {/* See note in HomeTabStack — CompanionProfileScreen dual-registration pattern. */}
      <Stack.Screen name="CompanionProfileScreen" component={CompanionProfileScreen} />
  </Stack.Navigator>
);

const ProfileTabStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
      <Stack.Screen name="InterestSelectionScreen" component={InterestSelectionScreen} />
      <Stack.Screen name="MyReviewsScreen" component={MyReviewsScreen} />
      <Stack.Screen name="WalletScreen" component={WalletScreen} />
      <Stack.Screen name="TransactionHistoryScreen" component={TransactionHistoryScreen} />
      <Stack.Screen name="TransactionDetailScreen" component={TransactionDetailScreen} />
      <Stack.Screen name="PaymentMethodsScreen" component={PaymentMethodsScreen} />
      <Stack.Screen name="AddPaymentMethodScreen" component={AddPaymentMethodScreen} />
      <Stack.Screen name="AddMoneyScreen" component={AddMoneyScreen} />
      <Stack.Screen name="WithdrawMoneyScreen" component={WithdrawMoneyScreen} />
      <Stack.Screen name="WithdrawalMethodsScreen" component={WithdrawalMethodsScreen} />
      <Stack.Screen name="AddBankAccountScreen" component={AddBankAccountScreen} />
      <Stack.Screen name="SettingsHubScreen" component={SettingsHubScreen} />
      <Stack.Screen name="NotificationPreferencesScreen" component={NotificationPreferencesScreen} />
      <Stack.Screen name="LanguageSelectionScreen" component={LanguageSelectionScreen} />
      <Stack.Screen name="AccountSettingsScreen" component={AccountSettingsScreen} />
      <Stack.Screen name="ChangeMobileNumberScreen" component={ChangeMobileNumberScreen} />
      <Stack.Screen name="DeleteAccountScreen" component={DeleteAccountScreen} />
      <Stack.Screen name="LegalAgreementsScreen" component={LegalAgreementsScreen} />
      
      {/* 
        NOTE: OTPVerificationScreen is intentionally dual-registered here in ProfileTabStack.
        They are also registered in their respective main stacks (AuthStack and SafetySupportStack).
        This allows them to be accessed directly from the Profile/Settings context with their own back-stack,
        without resetting the user's tab state. 
      */}
      <Stack.Screen name="OTPVerificationScreen" component={OTPVerificationScreen} />
      
      <Stack.Screen name="SpokenLanguagesScreen" component={SpokenLanguagesScreen} />
      <Stack.Screen name="LocationSelectionScreen" component={LocationSelectionScreen} />
      <Stack.Screen name="AppPermissionsScreen" component={AppPermissionsScreen} />
      <Stack.Screen name="AppLockScreen" component={AppLockScreen} />
      <Stack.Screen name="BlockedUsersScreen" component={BlockedUsersScreen} />
      <Stack.Screen name="SafetySettingsScreen" component={SafetySettingsScreen} />
      <Stack.Screen name="DataCacheScreen" component={DataCacheScreen} />
      <Stack.Screen name="DeactivateAccountScreen" component={DeactivateAccountScreen} />
      <Stack.Screen name="ActiveSessionsScreen" component={ActiveSessionsScreen} />
      <Stack.Screen name="SavedProfilesScreen" component={SavedProfilesScreen} />
      <Stack.Screen name="ReferFriendScreen" component={ReferFriendScreen} />

      {/* See note in HomeTabStack — CompanionProfileScreen dual-registration pattern. */}
      <Stack.Screen name="CompanionProfileScreen" component={CompanionProfileScreen} />
  </Stack.Navigator>
);

export const MainTabNavigator = () => {
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();
  
    const getTabBarStyle = (route: RouteProp<ParamListBase, string>) => {
    const routeName = getFocusedRouteNameFromRoute(route);
    
    // Root screens where the tab bar should be visible
    const rootScreens = [
      'HomeDashboardScreen',
      'DiscoverScreen', 
      'BookingsListScreen',
      'ChatListScreen',
      'ProfileScreen',
      undefined // undefined means it's on the initial route of the stack
    ];

    if (!rootScreens.includes(routeName as string | undefined)) {
      return { display: 'none' as const };
    }
    
    return {
      backgroundColor: theme.colors.surface,
      borderTopColor: theme.colors.border,
      height: 60 + insets.bottom,
      paddingBottom: 8 + insets.bottom,
      paddingTop: 8,
    };
  };

  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: getTabBarStyle(route),
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'help-circle-outline';

          if (route.name === 'HomeTab') {
            iconName = 'home-outline';
          } else if (route.name === 'DiscoverTab') {
            iconName = 'compass-outline';
          } else if (route.name === 'BookingsTab') {
            iconName = 'calendar-clock-outline';
          } else if (route.name === 'ChatTab') {
            iconName = 'message-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = 'account-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeTabStack} options={{ title: t('tabHome', 'Home') }} />
      <Tab.Screen name="DiscoverTab" component={DiscoverTabStack} options={{ title: t('tabDiscover', 'Discover') }} />
      <Tab.Screen name="BookingsTab" component={BookingsTabStack} options={{ title: t('tabBookings', 'Bookings') }} />
      <Tab.Screen name="ChatTab" component={ChatTabStack} options={{ title: t('tabMessages', 'Messages'), tabBarBadge: unreadCount > 0 ? unreadCount : undefined }} />
      <Tab.Screen name="ProfileTab" component={ProfileTabStack} options={{ title: t('tabProfile', 'Profile') }} />
    </Tab.Navigator>
  );
};
