/**
 * CoBuddy Customer — useServerMutation Hook
 *
 * Provides:
 *  - Async mutation execution with isPending state
 *  - Targeted query invalidation (only invalidates affected queries, avoids global refetch)
 *  - Clean onSuccess / onError lifecycle callbacks
 */

import { useState, useCallback } from 'react';
import { queryClient, type QueryKey } from './queryClient';

export interface UseServerMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateKeys?: QueryKey[];
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: Error, variables: TVariables) => void | Promise<void>;
}

export interface UseServerMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  isSuccess: boolean;
  data: TData | undefined;
  reset: () => void;
}

export function useServerMutation<TData = any, TVariables = any>(
  options: UseServerMutationOptions<TData, TVariables>
): UseServerMutationResult<TData, TVariables> {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | undefined>(undefined);

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsPending(true);
      setError(null);

      try {
        const result = await options.mutationFn(variables);
        setData(result);

        if (options.invalidateKeys && options.invalidateKeys.length > 0) {
          for (const key of options.invalidateKeys) {
            queryClient.invalidateQueries(key);
          }
        }

        if (options.onSuccess) {
          await options.onSuccess(result, variables);
        }

        return result;
      } catch (err: any) {
        const normalized = err instanceof Error ? err : new Error(String(err));
        setError(normalized);

        if (options.onError) {
          await options.onError(normalized, variables);
        }

        throw normalized;
      } finally {
        setIsPending(false);
      }
    },
    [options]
  );

  const mutate = useCallback(
    (variables: TVariables) => {
      mutateAsync(variables).catch(() => {});
    },
    [mutateAsync]
  );

  const reset = useCallback(() => {
    setIsPending(false);
    setError(null);
    setData(undefined);
  }, []);

  return {
    mutate,
    mutateAsync,
    isPending,
    isError: !!error,
    error,
    isSuccess: data !== undefined && !error,
    data,
    reset,
  };
}
