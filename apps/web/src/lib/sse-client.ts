import { fetchEventSource, type EventSourceMessage } from '@microsoft/fetch-event-source';

import { refreshAuthToken } from './request';

type EventHandler<T> = (event: string, data: T, raw: EventSourceMessage) => void;
type ErrorWithStatus = Error & { status?: number };

export interface SSEClientOptions<T = unknown> {
  path: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  withCredentials?: boolean;
  parseJSON?: boolean;
  controller?: AbortController;
  onOpen?: (response: Response) => void;
  onEvent?: EventHandler<T>;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export interface SSEConnection {
  controller: AbortController;
  stop: () => void;
}

export function startSSE<T = unknown>(options: SSEClientOptions<T>): SSEConnection {
  const {
    path,
    method = 'GET',
    headers,
    withCredentials = true,
    parseJSON = true,
    controller = new AbortController(),
    onOpen,
    onEvent,
    onError,
    onClose,
  } = options;

  const base = process.env.NEXT_PUBLIC_API_URL || '/api';
  const url = `${base.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
  let attemptedAuthRefresh = false;
  let silenceUnauthorizedError = false;
  let refreshFailed = false;

  const createStatusError = (status: number, message?: string): ErrorWithStatus => {
    const error = new Error(message ?? `SSE failed with status ${status}`) as ErrorWithStatus;
    error.status = status;
    return error;
  };

  fetchEventSource(url, {
    method,
    headers: {
      Accept: 'text/event-stream',
      ...headers,
    },
    credentials: withCredentials ? 'include' : 'same-origin',
    signal: controller.signal,
    async onopen(res) {
      if (res.status === 401) {
        if (!attemptedAuthRefresh) {
          attemptedAuthRefresh = true;
          const refreshed = await refreshAuthToken(base);
          silenceUnauthorizedError = refreshed;
          refreshFailed = !refreshed;
        } else {
          refreshFailed = true;
        }
        throw createStatusError(res.status, 'SSE unauthorized');
      }
      if (!res.ok) {
        throw createStatusError(res.status);
      }
      attemptedAuthRefresh = false;
      silenceUnauthorizedError = false;
      refreshFailed = false;
      onOpen?.(res);
    },
    onmessage(ev) {
      if (!ev.data) {
        return;
      }
      let payload: T | unknown = ev.data;
      if (parseJSON) {
        try {
          payload = JSON.parse(ev.data) as T;
        } catch (error) {
          onError?.(error instanceof Error ? error : new Error('Failed to parse SSE payload'));
          return;
        }
      }
      onEvent?.(ev.event || 'message', payload as T, ev);
    },
    onclose() {
      onClose?.();
    },
    onerror(err) {
      if (controller.signal.aborted) {
        return;
      }
      const error =
        err instanceof Error
          ? (err as ErrorWithStatus)
          : (new Error('SSE connection error') as ErrorWithStatus);
      if (silenceUnauthorizedError && error.status === 401) {
        silenceUnauthorizedError = false;
        return;
      }
      onError?.(error);
      if (error.status === 401 && refreshFailed) {
        controller.abort();
      }
    },
  }).catch((err) => {
    if (controller.signal.aborted) {
      return;
    }
    const error = err instanceof Error ? err : new Error('SSE connection failed');
    onError?.(error);
  });

  return {
    controller,
    stop: () => controller.abort(),
  };
}
