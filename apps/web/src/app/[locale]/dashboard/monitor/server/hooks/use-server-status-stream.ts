import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { startSSE } from '@/lib/sse-client';

import { DEFAULT_STATUS } from '../lib/status';
import { formatDateTime, formatDuration } from '../lib/format';
import type { ServerStatus, ServerStatusPatch } from '../type';

interface UseServerStatusStreamResult {
  status: ServerStatus;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  reconnect: () => void;
}

interface UseServerStatusStreamOptions {
  locale?: string;
  lessThanMinuteText?: string;
  connectionErrorText?: string;
}

export function useServerStatusStream(
  options: UseServerStatusStreamOptions = {},
): UseServerStatusStreamResult {
  const { locale, lessThanMinuteText, connectionErrorText } = options;
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [reconnectKey, setReconnectKey] = useState(0);
  const [now, setNow] = useState<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const mergeStatus = useCallback((patch: ServerStatusPatch) => {
    setStatus((prev) => {
      const base = prev ?? DEFAULT_STATUS;
      const next: ServerStatus = {
        host: patch.host ? { ...base.host, ...patch.host } : base.host,
        cpu: patch.cpu ? { ...base.cpu, ...patch.cpu } : base.cpu,
        memory: patch.memory ? { ...base.memory, ...patch.memory } : base.memory,
        disks: patch.disks ? patch.disks : base.disks,
        process: patch.process ? { ...base.process, ...patch.process } : base.process,
      };
      return next;
    });
    setLastUpdated(Date.now());
  }, []);

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

    startSSE<ServerStatus | ServerStatusPatch>({
      path: '/v1/monitor/server/stream',
      controller,
      onOpen: () => {
        setIsConnected(true);
        setError(null);
      },
      onEvent: (event, payload) => {
        if (event === 'snapshot') {
          setStatus(payload as ServerStatus);
          setLastUpdated(Date.now());
          setError(null);
          return;
        }
        mergeStatus(payload as ServerStatusPatch);
      },
      onError: (err) => {
        setIsConnected(false);
        setError(err.message || connectionErrorText || 'Connection error');
      },
      onClose: () => {
        setIsConnected(false);
        controllerRef.current = null;
      },
    });
  }, [connectionErrorText, mergeStatus]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect, reconnectKey]);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const reconnectStream = useCallback(() => {
    disconnect();
    setReconnectKey((key) => key + 1);
  }, [disconnect]);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden') {
        disconnect();
      } else {
        reconnectStream();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => {
      document.removeEventListener('visibilitychange', handler);
    };
  }, [disconnect, reconnectStream]);

  const isLoading = !status && !error;

  const derivedStatus = useMemo<ServerStatus>(() => {
    const base = status ?? DEFAULT_STATUS;
    const nowMs = now;

    const bootMs = base.host.bootTime ? Date.parse(base.host.bootTime) : 0;
    const hostUptimeSeconds =
      bootMs > 0 && typeof nowMs === 'number'
        ? Math.max(0, Math.floor((nowMs - bootMs) / 1000))
        : base.host.uptimeSeconds;

    const startMs = base.process.startTime ? Date.parse(base.process.startTime) : 0;
    const processUptimeSeconds =
      startMs > 0 && typeof nowMs === 'number'
        ? Math.max(0, Math.floor((nowMs - startMs) / 1000))
        : base.process.uptimeSeconds;

    const hostCurrentTime =
      typeof nowMs === 'number'
        ? formatDateTime(nowMs, locale)
        : base.host.currentTime || '-';

    return {
      ...base,
      host: {
        ...base.host,
        uptimeSeconds: hostUptimeSeconds,
        uptime: formatDuration(hostUptimeSeconds, locale, {
          lessThanMinuteText,
        }),
        currentTime: hostCurrentTime,
      },
      process: {
        ...base.process,
        uptimeSeconds: processUptimeSeconds,
        uptime: formatDuration(processUptimeSeconds, locale, {
          lessThanMinuteText,
        }),
      },
    };
  }, [lessThanMinuteText, locale, now, status]);

  return useMemo(
    () => ({
      status: derivedStatus,
      isConnected,
      isLoading,
      error,
      lastUpdated,
      reconnect: reconnectStream,
    }),
    [
      derivedStatus,
      error,
      isConnected,
      isLoading,
      lastUpdated,
      reconnectStream,
    ],
  );
}
