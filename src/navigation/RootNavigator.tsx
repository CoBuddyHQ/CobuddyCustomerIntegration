import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { ForceUpdateScreen } from '../screens/system/ForceUpdateScreen';
import { MaintenanceModeScreen } from '../screens/system/MaintenanceModeScreen';
import { NetworkErrorScreen } from '../screens/system/NetworkErrorScreen';

import { AuthStack } from './AuthStack';
import { OnboardingStack } from './OnboardingStack';
import { MainTabNavigator } from './MainTabNavigator';
import { SystemStateStack } from './SystemStateStack';
import { BookingFlowStack } from './BookingFlowStack';
import { KYCStack } from './KYCStack';
import { LiveSessionStack } from './LiveSessionStack';
import { SafetySupportStack } from './SafetySupportStack';

import { useAuthStore } from '../store/slices/authStore';

const Stack = createStackNavigator();

export const RootNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isOnboardingComplete = useAuthStore((state) => state.isOnboardingComplete);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const rehydrate = useAuthStore((state) => state.rehydrate);

  useEffect(() => {
    // Restore session from AsyncStorage on boot.
    // isHydrated becomes true once this completes (success or failure).
    rehydrate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navKey = !isHydrated
    ? 'splash'
    : !isAuthenticated
    ? 'auth'
    : !isOnboardingComplete
    ? 'onboarding'
    : 'main';

  return (
    <Stack.Navigator key={navKey} screenOptions={{ headerShown: false }}>
      {!isHydrated ? (
        // Show splash until session is restored (or confirmed absent)
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
      ) : !isAuthenticated ? (
        <Stack.Screen name="AuthStack" component={AuthStack} />
      ) : !isOnboardingComplete ? (
        <Stack.Screen name="OnboardingStack" component={OnboardingStack} />
      ) : (
        <Stack.Screen name="MainTabNavigator" component={MainTabNavigator} />
      )}

      {/* System state and modal screens */}
      <Stack.Screen name="ForceUpdateScreen" component={ForceUpdateScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="MaintenanceModeScreen" component={MaintenanceModeScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="NetworkErrorScreen" component={NetworkErrorScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="SystemStateStack" component={SystemStateStack} options={{ presentation: 'modal' }} />
      <Stack.Screen name="BookingFlowStack" component={BookingFlowStack} options={{ presentation: 'modal' }} />
      <Stack.Screen name="KYCStack" component={KYCStack} options={{ presentation: 'modal' }} />
      <Stack.Screen name="LiveSessionStack" component={LiveSessionStack} options={{ presentation: 'modal' }} />
      <Stack.Screen name="SafetySupportStack" component={SafetySupportStack} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
};
