import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface UseFetchOptions {
  cacheKey?: string;
  cacheDuration?: number;
  skip?: boolean;
  refetchInterval?: number;
}

export function useFetch<T>(
  url: string,
  options: RequestInit = {},
  fetchOptions: UseFetchOptions = {}
) {
  const {
    cacheKey = url,
    cacheDuration = CACHE_DURATION,
    skip = false,
    refetchInterval
  } = fetchOptions;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!skip);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<number | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (skip) return;

    // Check cache first
    if (!forceRefresh && cacheKey) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        setData(cached.data);
        setLoading(false);
        return cached.data;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Cache the result
      if (cacheKey) {
        cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      setData(result);
      setLoading(false);
      return result;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, [url, cacheKey, cacheDuration, skip, options]);

  useEffect(() => {
    fetchData();

    // Setup refetch interval if specified
    if (refetchInterval) {
      intervalRef.current = window.setInterval(() => {
        fetchData(true);
      }, refetchInterval);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, refetchInterval]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const invalidateCache = useCallback(() => {
    if (cacheKey) {
      cache.delete(cacheKey);
    }
  }, [cacheKey]);

  return { data, loading, error, refetch, invalidateCache };
}

export function clearAllCache() {
  cache.clear();
}

export function clearCacheByKey(key: string) {
  cache.delete(key);
}
