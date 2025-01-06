import { getVisitor, getToken, removeToken } from './cookie';

// Types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestOptions extends Omit<RequestInit, 'method'> {
  method?: HttpMethod;
  timeout?: number;
  routerToken?: string;
}

export interface ApiResponse<T = object> {
  data: T;
  status: number;
  message?: string;
}

// Constants
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
export const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';
export const DEFAULT_TIMEOUT =
  Number(process.env.NEXT_PUBLIC_TIME_OUT) || 30000;
export const API_URL = `${API_BASE_URL}/${API_VERSION}`;

// Utility functions
export const createFetchWithTimeout = (timeout: number) => {
  return async (
    url: RequestInfo | URL,
    options?: RequestInit
  ): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };
};

const getFullUrl = (input: RequestInfo | URL): RequestInfo | URL => {
  if (
    typeof input === 'string' &&
    !input.startsWith('http') &&
    !input.startsWith('//')
  ) {
    return `${API_URL}${input}`;
  }
  return input;
};

const enhanceRequestOptions = (options?: RequestOptions): RequestInit => {
  const enhancedOptions: RequestInit = { ...options };
  const headers = new Headers(enhancedOptions.headers);
  headers.set('X-Visitor-ID', getVisitor() || '');

  if (!(enhancedOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = options?.routerToken || getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  enhancedOptions.headers = headers;
  return enhancedOptions;
};

// Main functions
export const fetchWithEnhancements = async (
  input: RequestInfo | URL,
  options?: RequestOptions
): Promise<Response> => {
  const url = getFullUrl(input);

  const enhancedOptions = enhanceRequestOptions(options);
  const fetchWithTimeout = createFetchWithTimeout(
    options?.timeout || DEFAULT_TIMEOUT
  );

  try {
    return await fetchWithTimeout(url, enhancedOptions);
  } catch (error) {
    console.error(`Request failed: ${url}`, error);
    throw error;
  }
};

export const request = async <T>(
  input: RequestInfo | URL,
  options?: RequestOptions
): Promise<T> => {
  const response = await fetchWithEnhancements(input, options);
  const data: ApiResponse<T> = await response.json();
  switch (response.status) {
    case 200:
      return data.data;
    case 401:
      removeToken();
      // window.location.reload();
      throw new Error('Unauthorized');
    default:
      throw new Error(data.message || 'Unknown error occurred');
  }
};
