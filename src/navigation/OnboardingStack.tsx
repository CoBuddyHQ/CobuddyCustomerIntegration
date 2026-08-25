import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { theme } from '../theme';
import { FlowTracker } from '../services/flowTracker';

import { LegalConsentScreen } from '../screens/onboarding/LegalConsentScreen';
import { LocationPermissionScreen } from '../screens/auth/LocationPermissionScreen';
import { NotificationPermissionScreen } from '../screens/auth/NotificationPermissionScreen';
import { BasicProfileSetupScreen } from '../screens/onboarding/BasicProfileSetupScreen';
import { InterestSelectionScreen } from '../screens/onboarding/InterestSelectionScreen';
import { SafetyTutorialScreen } from '../screens/onboarding/SafetyTutorialScreen';
import { TrustedContactsScreen } from '../screens/safety/TrustedContactsScreen';

const Stack = createStackNavigator();

export const OnboardingStack = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const resolveStep = async () => {
      const result = await FlowTracker.reconcileOnboarding();
      if (isMounted) {
        setInitialRoute(result.screenName === 'MainTabNavigator' ? 'TrustedContactsScreen' : result.screenName);
      }
    };
    resolveStep();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      <Stack.Screen name="LegalConsentScreen" component={LegalConsentScreen} />
      <Stack.Screen name="LocationPermissionScreen" component={LocationPermissionScreen} />
      <Stack.Screen name="NotificationPermissionScreen" component={NotificationPermissionScreen} />
      <Stack.Screen name="BasicProfileSetupScreen" component={BasicProfileSetupScreen} />
      <Stack.Screen name="InterestSelectionScreen" component={InterestSelectionScreen} />
      <Stack.Screen name="SafetyTutorialScreen" component={SafetyTutorialScreen} />
      {/* 
        NOTE: TrustedContactsScreen is intentionally dual-registered here in OnboardingStack 
        and SafetySupportStack so it can be accessed during onboarding or from Safety Hub/Settings.
      */}
      <Stack.Screen name="TrustedContactsScreen" component={TrustedContactsScreen} />
    </Stack.Navigator>
  );
};
