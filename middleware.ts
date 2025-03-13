// middleware.ts 伪代码
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 获取请求路径
  const path = request.nextUrl.pathname;

  // 获取存储在Cookie中的token
  const token = request.cookies.get('token')?.value;

  // 定义需要保护的路由
  const protectedRoutes = ['/dashboard', '/settings', '/profile'];

  // 检查是否为受保护路由
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

  // 如果是受保护路由且没有token，重定向到登录页
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }
  if (token && path.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.next();
}

// 指定哪些路径需要应用中间件
export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/profile/:path*', '/auth/:path*'],
};