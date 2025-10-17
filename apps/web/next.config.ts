import { format } from 'date-fns';
import { NextConfig } from 'next';

const nextConfig: NextConfig = {};

switch (process.env.NODE_ENV) {
  case 'production':
    // nextConfig.output = 'export';
    nextConfig.images = {};
    nextConfig.images.unoptimized = true;
    break;
  case 'development':
    break;
}

process.env.NEXT_PUBLIC_BUILD_TIME = format(new Date(), 'yyyy-MM-dd HH:mm');

export default nextConfig;
