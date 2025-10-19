import { NextRequest } from 'next/server';

const backendOrigin =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:27391';
console.log(backendOrigin);
async function proxy(request: NextRequest) {
  if (!backendOrigin) {
    return new Response(
      JSON.stringify({ message: 'Backend origin is not configured' }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json',
        },
      },
    );
  }

  const upstream = new URL(
    request.nextUrl.pathname.replace(/^\/api/, '') || '/',
    backendOrigin,
  );
  upstream.search = request.nextUrl.search;
  const upstreamUrl = upstream.toString();

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  headers.set('x-forwarded-host', request.headers.get('host') ?? '');
  headers.set('x-forwarded-proto', request.nextUrl.protocol.replace(':', ''));

  let body: BodyInit | undefined;
  if (!['GET', 'HEAD'].includes(request.method) && request.body) {
    const contentType = headers.get('content-type') ?? '';
    if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('application/json') ||
      contentType.startsWith('text/')
    ) {
      body = await request.text();
    } else if (contentType.includes('multipart/form-data')) {
      // Preserve multipart boundary by using the original ArrayBuffer
      body = await request.arrayBuffer();
    } else {
      body = await request.arrayBuffer();
    }
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
    body,
    cache: 'no-store',
  };

  try {
    const response = await fetch(upstreamUrl, init);
    const responseHeaders = new Headers(response.headers);

    // Cloudflare disallows CORS wildcard with credentials; let backend control it.
    responseHeaders.delete('content-encoding');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: 'Failed to reach backend service',
        detail: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 502,
        headers: {
          'content-type': 'application/json',
        },
      },
    );
  }
}

export function GET(request: NextRequest) {
  return proxy(request);
}

export function POST(request: NextRequest) {
  return proxy(request);
}

export function PUT(request: NextRequest) {
  return proxy(request);
}

export function PATCH(request: NextRequest) {
  return proxy(request);
}

export function DELETE(request: NextRequest) {
  return proxy(request);
}

export function OPTIONS(request: NextRequest) {
  return proxy(request);
}

export function HEAD(request: NextRequest) {
  return proxy(request);
}
