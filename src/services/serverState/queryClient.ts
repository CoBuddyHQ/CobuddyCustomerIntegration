/**
 * CoBuddy Customer — Production Query Client & Cache Manager
 *
 * Provides:
 *  - Cache with key-based storage and prefix invalidation
 *  - In-flight request deduplication (prevents duplicate simultaneous HTTP requests)
 *  - Configurable stale-time & garbage-collection time
 *  - Safe AsyncStorage persistence (survives app reloads/restarts without flashes)
 *  - Zero sensitive data persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type QueryKey = readonly unknown[];

export interface QueryOptions<T> {
  staleTime?: number; // ms before data is considered stale (default: 60,000ms = 1 min)
  cacheTime?: number; // ms before unused data is garbage-collected (default: 900,000ms = 15 min)
  persist?: boolean;  // whether to persist safe cache to AsyncStorage (default: false)
  enabled?: boolean;  // whether query runs automatically (default: true)
}

export interface QueryCacheItem<T = any> {
  data: T;
  updatedAt: number;
  staleTime: number;
  cacheTime: number;
  persist: boolean;
}

const STORAGE_PREFIX = '@cbc_qcache_';

class QueryClient {
  private cache = new Map<string, QueryCacheItem>();
  private inFlight = new Map<string, Promise<any>>();
  private listeners = new Map<string, Set<(data: any) => void>>();
  private isPersistedLoaded = false;

  private serializeKey(key: QueryKey): string {
    return JSON.stringify(key);
  }

  /**
   * Initialize safe cache from AsyncStorage on app launch
   */
  async initPersistence(): Promise<void> {
    if (this.isPersistedLoaded) return;
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith(STORAGE_PREFIX));
      if (cacheKeys.length > 0) {
        const pairs = await Promise.all(
          cacheKeys.map(async (k) => [k, await AsyncStorage.getItem(k)] as [string, string | null])
        );
        const now = Date.now();
        for (const [sKey, value] of pairs) {
          if (value) {
            try {
              const item: QueryCacheItem = JSON.parse(value);
              // Discard if past garbage collection time
              if (now - item.updatedAt < item.cacheTime) {
                const queryKey = sKey.replace(STORAGE_PREFIX, '');
                this.cache.set(queryKey, item);
              } else {
                AsyncStorage.removeItem(sKey).catch(() => {});
              }
            } catch {
              // Ignore corrupt item
            }
          }
        }
      }
      this.isPersistedLoaded = true;
    } catch {
      this.isPersistedLoaded = true;
    }
  }

  /**
   * Get cached query data synchronously
   */
  getQueryData<T>(key: QueryKey): T | undefined {
    const sKey = this.serializeKey(key);
    const item = this.cache.get(sKey);
    return item ? (item.data as T) : undefined;
  }

  /**
   * Check if cached query data is fresh (not stale)
   */
  isQueryFresh(key: QueryKey): boolean {
    const sKey = this.serializeKey(key);
    const item = this.cache.get(sKey);
    if (!item) return false;
    return Date.now() - item.updatedAt < item.staleTime;
  }

  /**
   * Set cached query data directly (e.g. from optimistic update or push notification)
   */
  setQueryData<T>(key: QueryKey, data: T, options?: QueryOptions<T>): void {
    const sKey = this.serializeKey(key);
    const item: QueryCacheItem<T> = {
      data,
      updatedAt: Date.now(),
      staleTime: options?.staleTime ?? 60_000,
      cacheTime: options?.cacheTime ?? 900_000,
      persist: options?.persist ?? false,
    };
    this.cache.set(sKey, item);

    if (item.persist) {
      AsyncStorage.setItem(`${STORAGE_PREFIX}${sKey}`, JSON.stringify(item)).catch(() => {});
    }

    this.notifyListeners(sKey, data);
  }

  /**
   * Fetch query with in-flight deduplication and stale-time handling
   */
  async fetchQuery<T>(
    key: QueryKey,
    fetcher: () => Promise<T>,
    options?: QueryOptions<T>
  ): Promise<T> {
    const sKey = this.serializeKey(key);
    const staleTime = options?.staleTime ?? 60_000;
    const cacheTime = options?.cacheTime ?? 900_000;
    const persist = options?.persist ?? false;

    // 1. If cached and fresh, return immediately
    const cached = this.cache.get(sKey);
    if (cached && Date.now() - cached.updatedAt < cached.staleTime) {
      return cached.data as T;
    }

    // 2. In-flight promise sharing (DEDUPLICATION)
    const activePromise = this.inFlight.get(sKey);
    if (activePromise) {
      return activePromise as Promise<T>;
    }

    // 3. Initiate network request
    const promise = (async () => {
      try {
        const data = await fetcher();
        const item: QueryCacheItem<T> = {
          data,
          updatedAt: Date.now(),
          staleTime,
          cacheTime,
          persist,
        };
        this.cache.set(sKey, item);

        if (persist) {
          AsyncStorage.setItem(`${STORAGE_PREFIX}${sKey}`, JSON.stringify(item)).catch(() => {});
        }

        this.notifyListeners(sKey, data);
        return data;
      } finally {
        this.inFlight.delete(sKey);
      }
    })();

    this.inFlight.set(sKey, promise);
    return promise;
  }

  /**
   * Invalidate queries matching a key prefix
   */
  invalidateQueries(keyPrefix: QueryKey): void {
    const prefixStr = JSON.stringify(keyPrefix).slice(0, -1);
    for (const [sKey, item] of this.cache.entries()) {
      if (sKey.startsWith(prefixStr)) {
        item.updatedAt = 0; // Mark as stale
      }
    }
  }

  /**
   * Clear all cache for logout/account switching
   */
  async clearAll(): Promise<void> {
    this.cache.clear();
    this.inFlight.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith(STORAGE_PREFIX));
      if (cacheKeys.length > 0) {
        await Promise.all(cacheKeys.map((k) => AsyncStorage.removeItem(k)));
      }
    } catch {
      // Best-effort
    }
  }

  /**
   * Subscribe to cache updates
   */
  subscribe(key: QueryKey, callback: (data: any) => void): () => void {
    const sKey = this.serializeKey(key);
    let set = this.listeners.get(sKey);
    if (!set) {
      set = new Set();
      this.listeners.set(sKey, set);
    }
    set.add(callback);
    return () => {
      set?.delete(callback);
      if (set?.size === 0) {
        this.listeners.delete(sKey);
      }
    };
  }

  private notifyListeners(sKey: string, data: any): void {
    const set = this.listeners.get(sKey);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(data);
        } catch {
          // Swallow listener error
        }
      });
    }
  }
}

export const queryClient = new QueryClient();
