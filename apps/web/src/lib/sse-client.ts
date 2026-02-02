import { fetchEventSource, type EventSourceMessage } from '@microsoft/fetch-event-source';

import {
  handleUnauthorizedRedirect,
  refreshAuthToken,
  shouldAttemptAuthRefresh,
} from './request/auth';
import { DEFAULT_UNAUTHORIZED_MESSAGE } from './request/constants';

class RetryableAuthError extends Error {
  retryInMs: number;

  constructor(retryInMs = 0) {
    super('Retry SSE after refreshing auth');
    this.retryInMs = retryInMs;
  }
}

class FatalAuthError extends Error {}

type EventHandler<T> = (event: string, data: T, raw: EventSourceMessage) => void;

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

  const base = process.env.NEXT_PUBLIC_API_URL ?? '/api';
  const url = `${base.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
  let handledFatalError = false;

  fetchEventSource(url, {
    method,
    headers: {
      Accept: 'text/event-stream',
      ...headers,
    },
    credentials: withCredentials ? 'include' : 'same-origin',
    signal: controller.signal,
    async onopen(res) {
      if (res.ok) {
        onOpen?.(res);
        return;
      }

      const unauthorized = res.status === 401;
      const refreshExpired = res.status === 402;

      if (unauthorized && shouldAttemptAuthRefresh(url)) {
        const refreshed = await refreshAuthToken(base);
        if (refreshed) {
          throw new RetryableAuthError(0);
        }
      }

      if (unauthorized || refreshExpired) {
        handleUnauthorizedRedirect();
        throw new FatalAuthError(DEFAULT_UNAUTHORIZED_MESSAGE);
      }

      throw new Error(`SSE failed with status ${res.status}`);
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
      if (err instanceof RetryableAuthError) {
        return err.retryInMs;
      }

      if (err instanceof FatalAuthError) {
        handledFatalError = true;
        onError?.(err);
        throw err;
      }

      const error = err instanceof Error ? err : new Error('SSE connection error');
      onError?.(error);
    },
  }).catch((err) => {
    if (handledFatalError) {
      handledFatalError = false;
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
