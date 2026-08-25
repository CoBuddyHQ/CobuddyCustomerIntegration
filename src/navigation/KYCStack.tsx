import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { theme } from '../theme';
import { FlowTracker } from '../services/flowTracker';

import { KYCIntroScreen } from '../screens/verify/KYCIntroScreen';
import { DocumentVerificationScreen } from '../screens/verify/DocumentVerificationScreen';
import { SelfieCaptureScreen } from '../screens/verify/SelfieCaptureScreen';
import { LivenessDetectionScreen } from '../screens/verify/LivenessDetectionScreen';
import { VerificationProcessingScreen } from '../screens/verify/VerificationProcessingScreen';
import { VerificationPendingScreen } from '../screens/verify/VerificationPendingScreen';
import { VerificationRejectedScreen } from '../screens/verify/VerificationRejectedScreen';
import { VerificationSuccessScreen } from '../screens/verify/VerificationSuccessScreen';

const Stack = createStackNavigator();

export const KYCStack = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const resolveStep = async () => {
      const result = await FlowTracker.reconcileKyc();
      if (isMounted) {
        setInitialRoute(result.screenName);
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
      <Stack.Screen name="KYCIntroScreen" component={KYCIntroScreen} />
      <Stack.Screen name="DocumentVerificationScreen" component={DocumentVerificationScreen} />
      <Stack.Screen name="SelfieCaptureScreen" component={SelfieCaptureScreen} />
      <Stack.Screen name="LivenessDetectionScreen" component={LivenessDetectionScreen} />
      <Stack.Screen name="VerificationProcessingScreen" component={VerificationProcessingScreen} />
      <Stack.Screen name="VerificationPendingScreen" component={VerificationPendingScreen} />
      <Stack.Screen name="VerificationRejectedScreen" component={VerificationRejectedScreen} />
      <Stack.Screen name="VerificationSuccessScreen" component={VerificationSuccessScreen} />
    </Stack.Navigator>
  );
};
