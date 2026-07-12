import { useState, useEffect, useRef, useCallback } from 'react';

interface PollingOptions<T> {
  intervalMs?: number;
  fetchFn: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  enabled?: boolean;
}

export function useCommandCenterPolling<T>({
  intervalMs = 30000,
  fetchFn,
  onSuccess,
  onError,
  enabled = true
}: PollingOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const lastUpdatedRef = useRef<Date | null>(null);

  const isFetchingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backoffRef = useRef(intervalMs);

  const fetchData = useCallback(async (isInitial = false) => {
    if (!enabled || isFetchingRef.current) return;

    // Check if document is hidden (tab not active)
    if (typeof document !== 'undefined' && document.hidden && !isInitial) {
      return; // Skip polling if tab is backgrounded
    }

    try {
      isFetchingRef.current = true;
      if (isInitial) setIsLoading(true);

      const result = await fetchFn();

      setData(result);
      const now = new Date();
      setLastUpdated(now);
      lastUpdatedRef.current = now;
      setError(null);
      backoffRef.current = intervalMs; // Reset backoff on success

      if (onSuccess) onSuccess(result);
    } catch (err: any) {
      console.error("Polling error:", err);
      setError(err);

      // Exponential backoff up to 2 mins
      backoffRef.current = Math.min(backoffRef.current * 2, 120000);

      if (onError) onError(err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;

      // Schedule next poll
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fetchData(), backoffRef.current);
    }
  }, [fetchFn, enabled, intervalMs, onSuccess, onError]);

  useEffect(() => {
    fetchData(true);

    // Visibility change listener to resume polling immediately when tab becomes active
    const handleVisibilityChange = () => {
      if (!document.hidden && enabled) {
        // Tab became active, fetch immediately if we haven't recently
        const timeSinceLastFetch = lastUpdatedRef.current ? Date.now() - lastUpdatedRef.current.getTime() : Infinity;
        if (timeSinceLastFetch > intervalMs) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          fetchData();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchData, enabled, intervalMs]);

  return { data, isLoading, error, lastUpdated, refetch: () => fetchData(true) };
}
