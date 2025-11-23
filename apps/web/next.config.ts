import { format } from 'date-fns';
import { NextConfig } from 'next';

// OpenNext Cloudflare 仍依赖 Webpack 构建，显式关闭 Turbopack 以避免缺失 chunk。
process.env.NEXT_SKIP_TURBOPACK = '1';

const proxy = async () => {
  return [
    {
      source: '/api/:path*',
      destination: `${process.env.NEXT_PUBLIC_BASE_URL}/:path*`,
    },
  ];
};
const nextConfig: NextConfig = {};
switch (process.env.NODE_ENV) {
  case 'production':
    nextConfig.output = 'export';
    nextConfig.images = {};
    nextConfig.images.unoptimized = true;
    break;
  case 'development':
    nextConfig.rewrites = proxy;
    break;
}

process.env.NEXT_PUBLIC_BUILD_TIME = format(new Date(), 'yyyy-MM-dd HH:mm');

export default nextConfig;
