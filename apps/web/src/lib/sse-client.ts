import { fetchEventSource, type EventSourceMessage } from '@microsoft/fetch-event-source';

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

  const base = process.env.NEXT_PUBLIC_API_URL || '/api';
  const url = `${base.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;

  fetchEventSource(url, {
    method,
    headers: {
      Accept: 'text/event-stream',
      ...headers,
    },
    credentials: withCredentials ? 'include' : 'same-origin',
    signal: controller.signal,
    async onopen(res) {
      if (!res.ok) {
        throw new Error(`SSE failed with status ${res.status}`);
      }
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
      const error = err instanceof Error ? err : new Error('SSE connection error');
      onError?.(error);
    },
  }).catch((err) => {
    const error = err instanceof Error ? err : new Error('SSE connection failed');
    onError?.(error);
  });

  return {
    controller,
    stop: () => controller.abort(),
  };
}
