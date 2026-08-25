/**
 * CoBuddy Customer — useServerQuery Hook
 *
 * Provides:
 *  - Instant rendering from memory / persistent cache
 *  - Automatic background revalidation when data is stale
 *  - Request deduplication across multiple mounted components
 *  - Unified state model: { data, isLoading, isFetching, isError, error, isSuccess, isStale, refetch }
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
  options?: QueryOptions<T>
): UseServerQueryResult<T> {
  const enabled = options?.enabled ?? true;
  const initialCached = queryClient.getQueryData<T>(key);

  const [data, setData] = useState<T | undefined>(initialCached);
  const [isLoading, setIsLoading] = useState<boolean>(!initialCached && enabled);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const refetch = useCallback(async (): Promise<T> => {
    setIsFetching(true);
    setError(null);
    try {
      queryClient.invalidateQueries(key);
      const res = await queryClient.fetchQuery(key, fetcherRef.current, optionsRef.current);
      setData(res);
      setIsLoading(false);
      return res;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
      throw err;
    } finally {
      setIsFetching(false);
    }
  }, [JSON.stringify(key)]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const unsubscribe = queryClient.subscribe(key, (newData) => {
      if (isMounted) {
        setData(newData);
        setError(null);
        setIsLoading(false);
      }
    });

    const cachedData = queryClient.getQueryData<T>(key);
    const isFresh = queryClient.isQueryFresh(key);

    if (cachedData !== undefined) {
      setData(cachedData);
      setIsLoading(false);
    }

    if (!isFresh) {
      setIsFetching(true);
      queryClient
        .fetchQuery(key, fetcherRef.current, optionsRef.current)
        .then((res) => {
          if (isMounted) {
            setData(res);
            setError(null);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err instanceof Error ? err : new Error(String(err)));
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
            setIsFetching(false);
          }
        });
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [enabled, JSON.stringify(key)]);

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
