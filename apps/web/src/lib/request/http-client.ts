import {
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_UNAUTHORIZED_MESSAGE,
  SUCCESS_STATUS_MAX,
  SUCCESS_STATUS_MIN,
} from './constants';
import {
  handleUnauthorizedRedirect,
  refreshAuthToken,
  shouldAttemptAuthRefresh,
} from './auth';
import type {
  ApiResponse,
  RequestConfig,
  RequestOptions,
} from './types';

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

  updateLocale(locale?: string | null) {
    if (typeof locale !== 'string') {
      Reflect.deleteProperty(this.defaultHeaders, 'Accept-Language');
      return;
    }
    const trimmed = locale.trim();
    if (!trimmed) {
      Reflect.deleteProperty(this.defaultHeaders, 'Accept-Language');
      return;
    }
    this.defaultHeaders['Accept-Language'] = trimmed;
  }

  private handleUnauthorized(message?: string) {
    handleUnauthorizedRedirect(message, () => this.updateToken(null));
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
          response.status === 401 || apiResponse.code === 401;
        if (
          shouldRefresh &&
          !skipAuthRefresh &&
          shouldAttemptAuthRefresh(fullURL)
        ) {
          const refreshed = await refreshAuthToken(this.baseURL);
          if (refreshed) {
            return this.request<T>(url, { ...options, skipAuthRefresh: true });
          }
        }
        const refreshExpired =
          response.status === 402 || apiResponse.code === 402;
        if (refreshExpired) {
          this.handleUnauthorized(apiResponse.msg ?? undefined);
          throw new Error(apiResponse.msg ?? DEFAULT_UNAUTHORIZED_MESSAGE);
        }
        if (shouldRefresh) {
          this.handleUnauthorized(apiResponse.msg ?? undefined);
          throw new Error(apiResponse.msg ?? DEFAULT_UNAUTHORIZED_MESSAGE);
        }
        return apiResponse;
      } else if (contentType?.startsWith('text/')) {
        const textPayload = await response.text();
        if (
          response.status === 401 &&
          !skipAuthRefresh &&
          shouldAttemptAuthRefresh(fullURL)
        ) {
          const refreshed = await refreshAuthToken(this.baseURL);
          if (refreshed) {
            return this.request<T>(url, { ...options, skipAuthRefresh: true });
          }
        }
        const textMessage =
          typeof textPayload === 'string' && textPayload.trim().length > 0
            ? textPayload
            : undefined;
        if (response.status === 402) {
          this.handleUnauthorized(textMessage);
          throw new Error(textMessage ?? DEFAULT_UNAUTHORIZED_MESSAGE);
        }
        if (response.status === 401) {
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

      if (
        response.status === 401 &&
        !skipAuthRefresh &&
        shouldAttemptAuthRefresh(fullURL)
      ) {
        const refreshed = await refreshAuthToken(this.baseURL);
        if (refreshed) {
          return this.request<T>(url, { ...options, skipAuthRefresh: true });
        }
      }
      if (response.status === 402) {
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
