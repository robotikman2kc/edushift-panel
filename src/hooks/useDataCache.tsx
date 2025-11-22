import { useState, useEffect, useCallback } from 'react';
import { indexedDB, TableName } from '@/lib/indexedDB';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

const CACHE_PREFIX = 'data_cache_';
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Custom hook for caching IndexedDB data with automatic invalidation
 * @param key - Unique cache key
 * @param tableName - IndexedDB table name
 * @param filter - Optional filter function
 * @param cacheTime - Cache duration in milliseconds (default: 5 minutes)
 */
export function useDataCache<T = any>(
  key: string,
  tableName: TableName,
  filter?: (item: any) => boolean,
  cacheTime: number = DEFAULT_CACHE_TIME
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cacheKey = `${CACHE_PREFIX}${key}`;

  const getCachedData = useCallback((): CacheEntry<T[]> | null => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (!cached) return null;

      const entry: CacheEntry<T[]> = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - entry.timestamp < entry.expiresIn) {
        return entry;
      }

      // Cache expired, remove it
      sessionStorage.removeItem(cacheKey);
      return null;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }, [cacheKey]);

  const setCachedData = useCallback((data: T[]) => {
    try {
      const entry: CacheEntry<T[]> = {
        data,
        timestamp: Date.now(),
        expiresIn: cacheTime,
      };
      sessionStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }, [cacheKey, cacheTime]);

  const fetchData = useCallback(async (useCache: boolean = true) => {
    try {
      setLoading(true);
      setError(null);

      // Try to get from cache first
      if (useCache) {
        const cached = getCachedData();
        if (cached) {
          setData(cached.data);
          setLoading(false);
          return cached.data;
        }
      }

      // Fetch from IndexedDB
      let result = await indexedDB.select(tableName, filter);
      
      // Cache the result
      setCachedData(result);
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch data');
      setError(error);
      console.error('Error fetching data:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [tableName, filter, getCachedData, setCachedData]);

  const invalidateCache = useCallback(() => {
    sessionStorage.removeItem(cacheKey);
    fetchData(false);
  }, [cacheKey, fetchData]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(false),
    invalidateCache,
  };
}

/**
 * Hook for caching static data that rarely changes
 * Uses longer cache time (30 minutes)
 */
export function useStaticDataCache<T = any>(
  key: string,
  tableName: TableName,
  filter?: (item: any) => boolean
) {
  return useDataCache<T>(key, tableName, filter, 30 * 60 * 1000);
}

/**
 * Invalidate all caches
 */
export function invalidateAllCaches() {
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      sessionStorage.removeItem(key);
    }
  });
}

/**
 * Invalidate specific cache by pattern
 */
export function invalidateCacheByPattern(pattern: string) {
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX) && key.includes(pattern)) {
      sessionStorage.removeItem(key);
    }
  });
}
