/**
 * HTTP 请求类封装（强类型，无 any）
 * 配合 React Query 使用，简化超时和重试逻辑
 */
import { toast } from 'sonner';

interface RequestConfig {
  baseURL?: string;
  headers?: Record<string, string>;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  data?: unknown; // 用于传递请求体
}

interface ApiResponse<T> {
  data: T;
  status?: number;
  ok?: boolean;
  code?: number; // 后端业务状态码
  msg?: string | null; // 后端消息
}

const DEFAULT_SUCCESS_CODE = 200;
const DEFAULT_ERROR_MESSAGE = '请求失败，请稍后重试';

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

  private unwrapResponse<T>(response: ApiResponse<T>): T {
    if (
      typeof response.code === 'number' &&
      response.code !== DEFAULT_SUCCESS_CODE
    ) {
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
    const { params, data, ...fetchOptions } = options;

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
      });
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const jsonPayload = await response.json();
        return this.resolveJsonResponse<T>(jsonPayload, response);
      } else if (contentType?.startsWith('text/')) {
        const responseData = (await response.text()) as T;
        return {
          data: responseData,
          status: response.status,
          ok: response.ok,
        };
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
      typeof record?.code === 'number'
        ? (record.code as number)
        : undefined;
    const message =
      record && (typeof record.msg === 'string' || record.msg === null)
        ? ((record.msg ?? null) as string | null)
        : null;

    if (businessCode === 401) {
      localStorage.clear();
      toast.error('登录信息已过期，请重新登录');
    }

    if (
      typeof businessCode === 'number' &&
      businessCode !== DEFAULT_SUCCESS_CODE
    ) {
      throw new Error(message ?? DEFAULT_ERROR_MESSAGE);
    }

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
