'use client';

import { startSSE } from '@/lib/sse-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getCacheOverview } from '../api';
import { DEFAULT_OVERVIEW, mergeCacheOverview } from '../lib/overview';
import type { CacheOverview, CacheOverviewPatch } from '../type';

interface UseCacheOverviewStreamResult {
  overview: CacheOverview;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  reconnect: () => void;
}

export function useCacheOverviewStream(): UseCacheOverviewStreamResult {
  const [overview, setOverview] = useState<CacheOverview | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [reconnectKey, setReconnectKey] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  const disconnect = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (controllerRef.current) {
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    startSSE<CacheOverview | CacheOverviewPatch>({
      path: '/v1/monitor/cache/stream',
      controller,
      onOpen: () => {
        setIsConnected(true);
        setError(null);
      },
      onEvent: (event, payload) => {
        if (event === 'snapshot') {
          setOverview(payload as CacheOverview);
          setLastUpdated(Date.now());
          setError(null);
          return;
        }
        setOverview((prev) =>
          mergeCacheOverview(
            prev ?? DEFAULT_OVERVIEW,
            payload as CacheOverviewPatch,
          ),
        );
        setLastUpdated(Date.now());
      },
      onError: (err) => {
        setIsConnected(false);
        setError(err.message ?? '');
      },
      onClose: () => {
        setIsConnected(false);
        controllerRef.current = null;
      },
    });
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect, reconnectKey]);

  const reconnect = useCallback(() => {
    setError(null);
    disconnect();
    setReconnectKey((key) => key + 1);
  }, [disconnect]);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden') {
        disconnect();
      } else {
        reconnect();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => {
      document.removeEventListener('visibilitychange', handler);
    };
  }, [disconnect, reconnect]);

  const isLoading = !overview && error === null;

  const snapshot = useMemo<UseCacheOverviewStreamResult>(
    () => ({
      overview: overview ?? DEFAULT_OVERVIEW,
      isConnected,
      isLoading,
      error,
      lastUpdated,
      reconnect,
    }),
    [error, isConnected, isLoading, lastUpdated, overview, reconnect],
  );

  return snapshot;
}
