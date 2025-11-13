/**
 * HTTP 请求类封装（强类型，无 any）
 * 配合 React Query 使用，简化超时和重试逻辑
 */
interface RequestConfig {
  baseURL?: string;
  headers?: Record<string, string>;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  data?: unknown; // 用于传递请求体
  skipAuthRefresh?: boolean;
}

interface ApiResponse<T> {
  data: T;
  status?: number;
  ok?: boolean;
  code?: number; // 后端业务状态码
  msg?: string | null; // 后端消息
}

const SUCCESS_STATUS_MIN = 200;
const SUCCESS_STATUS_MAX = 299;
const DEFAULT_ERROR_MESSAGE = '请求失败，请稍后重试';
const DEFAULT_UNAUTHORIZED_MESSAGE = '登录信息已过期，请重新登录';
const LOGIN_ROUTE = '/login';

let hasTriggeredUnauthorizedRedirect = false;
let refreshPromise: Promise<boolean> | null = null;

const showSessionExpiredDialog = (
  message: string,
  onConfirm: () => void,
  onCancel: () => void,
) => {
  if (typeof window === 'undefined') {
    return;
  }

  const openDialog = () =>
    import('@/components/session-expired-dialog')
      .then(({ showSessionExpiredDialogUI }) => {
        showSessionExpiredDialogUI({
          message,
          onConfirm,
          onCancel,
        });
      })
      .catch(() => {
        const confirmed =
          typeof window.confirm === 'function' ? window.confirm(message) : true;
        if (confirmed) {
          onConfirm();
        } else {
          onCancel();
        }
      });

  void openDialog();
};

function isSuccessfulStatus(code?: number) {
  if (typeof code !== 'number') {
    return true;
  }
  return code >= SUCCESS_STATUS_MIN && code <= SUCCESS_STATUS_MAX;
}

export class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(config: RequestConfig = {}) {
    this.baseURL = config.baseURL || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }
  updateToken(token?: string | null) {
    if (!token) {
      Reflect.deleteProperty(this.defaultHeaders, 'Authorization');
      return;
    }
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  private handleUnauthorized(message?: string) {
    this.updateToken(null);

    const fallbackMessage =
      message && message.trim().length > 0
        ? message
        : DEFAULT_UNAUTHORIZED_MESSAGE;

    if (typeof window === 'undefined') {
      throw new Error(fallbackMessage);
    }

    try {
      localStorage.clear();
    } catch {
      // ignore storage clear failures (e.g. disabled storage)
    }

    const alreadyOnLogin = window.location.pathname.startsWith(LOGIN_ROUTE);
    if (alreadyOnLogin) {
      return;
    }

    if (hasTriggeredUnauthorizedRedirect) {
      return;
    }

    hasTriggeredUnauthorizedRedirect = true;
    const currentUrl =
      window.location.pathname + window.location.search + window.location.hash;
    const redirectParam = encodeURIComponent(currentUrl || '/');
    const target = `${LOGIN_ROUTE}?redirect=${redirectParam}`;

    showSessionExpiredDialog(
      fallbackMessage,
      () => {
        window.location.replace(target);
      },
      () => {
        hasTriggeredUnauthorizedRedirect = false;
      },
    );
  }

  private unwrapResponse<T>(response: ApiResponse<T>): T {
    if (!isSuccessfulStatus(response.code)) {
      throw new Error(response.msg ?? DEFAULT_ERROR_MESSAGE);
    }
    return response.data;
  }

  private buildURL(url: string, params?: Record<string, unknown>): string {
    let fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const paramString = searchParams.toString();
      if (paramString) {
        fullURL += `${fullURL.includes('?') ? '&' : '?'}${paramString}`;
      }
    }

    return fullURL;
  }

  private shouldAttemptRefresh(url: string) {
    const normalized = url.toLowerCase();
    return (
      !normalized.includes('/auth/login') &&
      !normalized.includes('/auth/refresh')
    );
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (refreshPromise) {
      return refreshPromise;
    }
    const refreshURL = this.buildURL('/v1/auth/refresh');
    refreshPromise = fetch(refreshURL, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
      .then(async (response) => {
        if (!response.ok) {
          return false;
        }
        const payload = await response
          .json()
          .catch(() => ({ code: response.status }));
        if (
          payload &&
          typeof payload.code === 'number' &&
          payload.code !== 200
        ) {
          return false;
        }
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
    return refreshPromise;
  }

  async request<T>(
    url: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { params, data, skipAuthRefresh, ...fetchOptions } = options;

    const fullURL = this.buildURL(url, params);

    const headers: HeadersInit = {
      ...this.defaultHeaders,
      ...(fetchOptions.headers || {}),
    };

    let body = fetchOptions.body;

    // 如果提供了 data，优先使用
    if (data !== undefined) {
      if (data instanceof FormData) {
        body = data;
        Reflect.deleteProperty(headers, 'Content-Type'); // FormData 不需要手动设置 Content-Type
      } else {
        body = JSON.stringify(data);
      }
    }
    try {
      const response = await fetch(fullURL, {
        ...fetchOptions,
        headers,
        body,
        credentials: fetchOptions.credentials ?? 'same-origin',
      });
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const jsonPayload = await response.json();
        const apiResponse = this.resolveJsonResponse<T>(jsonPayload, response);
        const shouldRefresh =
          response.status === 402 || apiResponse.code === 402;
        if (shouldRefresh) {
          if (!skipAuthRefresh && this.shouldAttemptRefresh(fullURL)) {
            const refreshed = await this.tryRefreshToken();
            if (refreshed) {
              return this.request<T>(url, { ...options, skipAuthRefresh: true });
            }
          }
          this.handleUnauthorized(apiResponse.msg ?? undefined);
          throw new Error(apiResponse.msg ?? DEFAULT_UNAUTHORIZED_MESSAGE);
        }
        const isUnauthorized =
          response.status === 401 || apiResponse.code === 401;
        if (isUnauthorized) {
          this.handleUnauthorized(apiResponse.msg ?? undefined);
          throw new Error(apiResponse.msg ?? DEFAULT_UNAUTHORIZED_MESSAGE);
        }
        return apiResponse;
      } else if (contentType?.startsWith('text/')) {
        const textPayload = await response.text();
        if (response.status === 402) {
          if (!skipAuthRefresh && this.shouldAttemptRefresh(fullURL)) {
            const refreshed = await this.tryRefreshToken();
            if (refreshed) {
              return this.request<T>(url, { ...options, skipAuthRefresh: true });
            }
          }
          const textMessage =
            typeof textPayload === 'string' && textPayload.trim().length > 0
              ? textPayload
              : undefined;
          this.handleUnauthorized(textMessage);
          throw new Error(textMessage ?? DEFAULT_UNAUTHORIZED_MESSAGE);
        }
        if (response.status === 401) {
          const textMessage =
            typeof textPayload === 'string' && textPayload.trim().length > 0
              ? textPayload
              : undefined;
          this.handleUnauthorized(textMessage);
          throw new Error(textMessage ?? DEFAULT_UNAUTHORIZED_MESSAGE);
        }
        if (!response.ok) {
          const message =
            typeof textPayload === 'string' && textPayload.trim().length > 0
              ? textPayload
              : response.statusText || DEFAULT_ERROR_MESSAGE;
          throw new Error(message);
        }
        return {
          data: textPayload as T,
          status: response.status,
          ok: response.ok,
        };
      }

      if (response.status === 402) {
        if (!skipAuthRefresh && this.shouldAttemptRefresh(fullURL)) {
          const refreshed = await this.tryRefreshToken();
          if (refreshed) {
            return this.request<T>(url, { ...options, skipAuthRefresh: true });
          }
        }
        this.handleUnauthorized();
        throw new Error(DEFAULT_UNAUTHORIZED_MESSAGE);
      }
      if (response.status === 401) {
        this.handleUnauthorized();
        throw new Error(DEFAULT_UNAUTHORIZED_MESSAGE);
      }
      if (!response.ok) {
        throw new Error(response.statusText || DEFAULT_ERROR_MESSAGE);
      }

      return {
        data: (await response.blob()) as T,
        status: response.status,
        ok: response.ok,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('网络请求失败');
    }
  }

  // GET 请求
  async get<T>(
    url: string,
    params?: Record<string, string | number | boolean>,
    options?: Omit<RequestOptions, 'params'>,
  ) {
    const response = await this.request<T>(url, {
      ...options,
      method: 'GET',
      params,
    });
    return this.unwrapResponse(response);
  }

  // POST 请求
  post<T = unknown, B = unknown>(
    url: string,
    data?: B,
    options?: Omit<RequestOptions, 'data'>,
  ) {
    return this.sendWithBody<T, B>(url, 'POST', data, options);
  }

  // PUT 请求
  put<T = unknown, B = unknown>(
    url: string,
    data?: B,
    options?: Omit<RequestOptions, 'data'>,
  ) {
    return this.sendWithBody<T, B>(url, 'PUT', data, options);
  }

  // PATCH 请求
  patch<T = unknown, B = unknown>(
    url: string,
    data?: B,
    options?: Omit<RequestOptions, 'data'>,
  ) {
    return this.sendWithBody<T, B>(url, 'PATCH', data, options);
  }

  // DELETE 请求
  async delete<T = unknown>(url: string, options?: RequestOptions) {
    const response = await this.request<T>(url, {
      ...options,
      method: 'DELETE',
    });
    return this.unwrapResponse(response);
  }

  // 上传文件
  async upload<T = unknown>(
    url: string,
    formData: FormData,
    options?: Omit<RequestOptions, 'data' | 'body'>,
  ) {
    const response = await this.request<T>(url, {
      ...options,
      method: 'POST',
      data: formData,
    });
    return this.unwrapResponse(response);
  }

  private async sendWithBody<T, B>(
    url: string,
    method: 'POST' | 'PUT' | 'PATCH',
    data?: B,
    options?: Omit<RequestOptions, 'data'>,
  ) {
    const response = await this.request<T>(url, {
      ...options,
      method,
      data,
    });
    return this.unwrapResponse(response);
  }

  private resolveJsonResponse<T>(
    payload: unknown,
    response: Response,
  ): ApiResponse<T> {
    const record =
      typeof payload === 'object' && payload !== null
        ? (payload as Record<string, unknown>)
        : undefined;

    const businessCode =
      typeof record?.code === 'number' ? (record.code as number) : undefined;
    const message =
      record && (typeof record.msg === 'string' || record.msg === null)
        ? ((record.msg ?? null) as string | null)
        : null;
    const resolvedData =
      record && Object.prototype.hasOwnProperty.call(record, 'data')
        ? (record.data as T)
        : (payload as T);

    return {
      data: resolvedData,
      status: response.status,
      ok: response.ok,
      code: businessCode,
      msg: message,
    };
  }
}

// 创建默认实例
export const http = new HttpClient({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || '/api'}`,
});

// 快捷导出函数
export const get = http.get.bind(http);
export const post = http.post.bind(http);
export const put = http.put.bind(http);
export const patch = http.patch.bind(http);
export const del = http.delete.bind(http);
export const upload = http.upload.bind(http);

export default http;
