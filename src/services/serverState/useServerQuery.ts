/**
 * CoBuddy Customer — useServerQuery Hook
 *
 * Provides:
 *  - Instant rendering from memory / persistent cache
 *  - Automatic background revalidation when data is stale
 *  - Request deduplication across multiple mounted components
 *  - Unified state model: { data, isLoading, isFetching, isError, error, isSuccess, isStale, refetch }
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { queryClient, type QueryKey, type QueryOptions } from './queryClient';

export interface UseServerQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;     // true only on first load when no cached data exists
  isFetching: boolean;    // true whenever an HTTP request is in-flight
  isError: boolean;
  error: Error | null;
  isSuccess: boolean;
  isStale: boolean;
  refetch: () => Promise<T>;
}

export function useServerQuery<T>(
  key: QueryKey,
  fetcher: () => Promise<T>,
  options?: QueryOptions
): UseServerQueryResult<T> {
  const enabled = options?.enabled ?? true;
  const keyIdentity = JSON.stringify(key);
  const stableKey = useMemo(() => JSON.parse(keyIdentity) as QueryKey, [keyIdentity]);
  const initialCached = queryClient.getQueryData<T>(stableKey);
  const [result, setResult] = useState<{ key: string; data: T } | null>(
    initialCached === undefined ? null : { key: keyIdentity, data: initialCached },
  );
  const [queryStatus, setQueryStatus] = useState<{
    key: string;
    isLoading: boolean;
    isFetching: boolean;
    error: Error | null;
  }>({ key: keyIdentity, isLoading: initialCached === undefined && enabled, isFetching: false, error: null });
  const cachedData = queryClient.getQueryData<T>(stableKey);
  const data = result?.key === keyIdentity ? result.data : cachedData;
  const error = queryStatus.key === keyIdentity ? queryStatus.error : null;
  const isLoading = enabled && data === undefined && (
    queryStatus.key === keyIdentity ? queryStatus.isLoading : true
  );
  const isFetching = enabled && (
    queryStatus.key === keyIdentity ? queryStatus.isFetching : !queryClient.isQueryFresh(stableKey)
  );

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const refetch = useCallback(async (): Promise<T> => {
    setQueryStatus({ key: keyIdentity, isLoading: data === undefined, isFetching: true, error: null });
    try {
      queryClient.invalidateQueries(stableKey);
      const res = await queryClient.fetchQuery(stableKey, fetcherRef.current, optionsRef.current);
      setResult({ key: keyIdentity, data: res });
      setQueryStatus({ key: keyIdentity, isLoading: false, isFetching: false, error: null });
      return res;
    } catch (err: unknown) {
      setQueryStatus({
        key: keyIdentity, isLoading: false, isFetching: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }, [data, keyIdentity, stableKey]);

  useEffect(() => {
    if (!enabled) {
      setQueryStatus({ key: keyIdentity, isLoading: false, isFetching: false, error: null });
      return;
    }

    let isMounted = true;

    const unsubscribe = queryClient.subscribe(stableKey, (newData: T) => {
      if (isMounted) {
        setResult({ key: keyIdentity, data: newData });
        setQueryStatus({ key: keyIdentity, isLoading: false, isFetching: false, error: null });
      }
    });

    const effectCachedData = queryClient.getQueryData<T>(stableKey);
    const isFresh = queryClient.isQueryFresh(stableKey);

    if (effectCachedData !== undefined) {
      setResult({ key: keyIdentity, data: effectCachedData });
    }

    if (!isFresh) {
      setQueryStatus({ key: keyIdentity, isLoading: effectCachedData === undefined, isFetching: true, error: null });
      queryClient
        .fetchQuery(stableKey, fetcherRef.current, optionsRef.current)
        .then((res) => {
          if (isMounted) {
            setResult({ key: keyIdentity, data: res });
            setQueryStatus({ key: keyIdentity, isLoading: false, isFetching: false, error: null });
          }
        }).catch((err: unknown) => {
          if (isMounted) {
            setQueryStatus({
              key: keyIdentity, isLoading: false, isFetching: false,
              error: err instanceof Error ? err : new Error(String(err)),
            });
          }
        })
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [enabled, keyIdentity, stableKey]);

  const isStale = !queryClient.isQueryFresh(key);

  return {
    data,
    isLoading,
    isFetching,
    isError: !!error,
    error,
    isSuccess: data !== undefined && !error,
    isStale,
    refetch,
  };
}
