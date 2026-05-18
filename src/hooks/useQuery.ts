import { useQuery as useTanStackQuery, UseQueryOptions } from '@tanstack/react-query';

interface QueryOptions<T> {
  queryKey: string;
  queryFn: () => Promise<T>;
  enabled?: boolean;
}

// Wrapper to keep compatibility with existing code
export function useQuery<T>({ queryKey, queryFn, enabled = true }: QueryOptions<T>) {
  const query = useTanStackQuery<T>({
    queryKey: [queryKey],
    queryFn,
    enabled,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
