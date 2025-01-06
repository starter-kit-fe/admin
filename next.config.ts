import type { NextConfig } from 'next';
import dayjs from 'dayjs';
const nextConfig: NextConfig = {};
const proxy = async () => {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/:path*',
    },
  ];
};
switch (process.env.NODE_ENV) {
  case 'production':
    nextConfig.output = 'export';
    nextConfig.images = {};
    nextConfig.images.unoptimized = true;
    nextConfig.distDir = 'dist';
    break;
  case 'development':
    nextConfig.rewrites = proxy;
    break;
}
process.env.NEXT_PUBLIC_BUILD_TIME = dayjs().format('YYYY-MM-DD HH:mm');

export default nextConfig;
