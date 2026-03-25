export interface RequestConfig {
  baseURL?: string;
  headers?: Record<string, string>;
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  data?: unknown;
  skipAuthRefresh?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  status?: number;
  ok?: boolean;
  code?: number;
  msg?: string | null;
}
