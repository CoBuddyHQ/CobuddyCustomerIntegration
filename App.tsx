/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { theme } from './src/theme';
import { useHardwareBackLock } from './src/hooks/useSmartNavigation';
import { initAppStateSync } from './src/services/serverState';
import { FlowTracker } from './src/services/flowTracker';

export const customerNavRef = createNavigationContainerRef<any>();

// Initialize i18n
import './src/i18n';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.background,
  },
};

function App() {
  // Global lock against double hardware back presses that corrupt react-native-screens
  useHardwareBackLock();

  React.useEffect(() => {
    const cleanup = initAppStateSync();
    return cleanup;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <NavigationContainer
          ref={customerNavRef}
          theme={navTheme}
          onStateChange={() => {
            if (customerNavRef.isReady()) {
              const currentRoute = customerNavRef.getCurrentRoute();
              if (currentRoute && currentRoute.name) {
                FlowTracker.saveActiveScreen(currentRoute.name);
              }
            }
          }}
        >
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
