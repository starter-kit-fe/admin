// Keep Env structural to avoid relying on global Fetcher types.
export interface Env {
  ASSETS: { fetch: typeof fetch }; // 静态资源绑定
  BACKEND_ORIGIN: string; // wrangler.toml 中的 vars
}

// Minimal ExecutionContext shape for Wrangler without depending on global types.
interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // 1. 处理 /api/** 反向代理
    if (url.pathname.startsWith('/api/')) {
      // 后端地址，从环境变量读取
      const backendBase = env.BACKEND_ORIGIN || 'https://admin-api.h06i.com';

      // 去掉 /api 前缀
      const apiPath = url.pathname.replace(/^\/api/, '') || '/';

      // 拼目标地址
      const targetUrl = new URL(apiPath + url.search, backendBase);

      const init: RequestInit = {
        method: request.method,
        headers: request.headers,
      };

      // GET / HEAD 不带 body，其它方法转发 body
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = request.body;
      }

      const resp = await fetch(targetUrl.toString(), init);

      // 直接把后端响应透传回去
      return new Response(resp.body, {
        status: resp.status,
        headers: resp.headers,
      });
    }

    // 2. 非 /api/** 请求：交给 Static Assets（out 目录）
    // env.ASSETS.fetch 会根据 [assets] 目录自动返回文件
    const assetResponse = await env.ASSETS.fetch(request);

    // 如果你是 SPA，需要 history 路由 fallback 到 index.html，可以在 404 时兜底：
    if (assetResponse.status === 404) {
      // 再试一次 /index.html
      const indexUrl = new URL('/index.html', url);
      return env.ASSETS.fetch(
        new Request(indexUrl.toString(), {
          method: 'GET',
          headers: request.headers,
        }),
      );
    }

    return assetResponse;
  },
};
