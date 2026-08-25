/**
 * CoBuddy Customer — AppState Sync & Controlled Foreground Revalidation
 *
 * Listens to React Native AppState changes:
 *  - When the app transitions from background to 'active', triggers debounced revalidation.
 *  - Avoids request storms by refreshing only stale queries that are currently in-memory.
 */

import { AppState, type AppStateStatus } from 'react-native';
import { queryClient } from './queryClient';

let _lastState: AppStateStatus = AppState.currentState;
let _debounceTimer: ReturnType<typeof setTimeout> | null = null;
let _isInitialized = false;

export function initAppStateSync(onForegroundRefresh?: () => void | Promise<void>): () => void {
  if (_isInitialized) return () => {};
  _isInitialized = true;

  queryClient.initPersistence();

  const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (_lastState.match(/inactive|background/) && nextState === 'active') {
      if (_debounceTimer) clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(async () => {
        if (__DEV__) {
          console.log('[AppStateSync] Customer App returned to foreground — triggering smart revalidation');
        }
        if (onForegroundRefresh) {
          try {
            await onForegroundRefresh();
          } catch {
            // Non-critical background refresh failure
          }
        }
      }, 1000);
    }
    _lastState = nextState;
  });

  return () => {
    subscription.remove();
    if (_debounceTimer) clearTimeout(_debounceTimer);
    _isInitialized = false;
  };
}
