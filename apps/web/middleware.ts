// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const API_PREFIX = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_BACKEND_ORIGIN = process.env.NEXT_PUBLIC_BASE_URL as string;

export const config = {
  matcher: [`${API_PREFIX}/:path*`],
};

export async function middleware(req: NextRequest) {
  const backendOrigin =
    process.env.BACKEND_ORIGIN ??
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN ??
    DEFAULT_BACKEND_ORIGIN;

  let targetURL: URL;

  try {
    targetURL = new URL(
      req.nextUrl.pathname + req.nextUrl.search,
      backendOrigin,
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Invalid backend origin configuration.' },
      { status: 502 },
    );
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('host', targetURL.host);
  requestHeaders.set('x-forwarded-host', req.headers.get('host') ?? '');
  requestHeaders.set(
    'x-forwarded-proto',
    req.nextUrl.protocol.replace(':', ''),
  );
  requestHeaders.delete('content-length');

  const proxiedRequest = new Request(targetURL.toString(), {
    method: req.method,
    headers: requestHeaders,
    body: ['GET', 'HEAD'].includes(req.method) ? null : req.body,
    redirect: 'manual',
  });

  const backendResponse = await fetch(proxiedRequest);
  const responseHeaders = new Headers(backendResponse.headers);

  // 确保响应头不会泄露后端真实地址
  if (responseHeaders.has('location')) {
    const location = responseHeaders.get('location') ?? '';
    if (location.startsWith(backendOrigin)) {
      const relativeLocation = location.replace(backendOrigin, '');
      responseHeaders.set('location', relativeLocation || '/');
    }
  }

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}
