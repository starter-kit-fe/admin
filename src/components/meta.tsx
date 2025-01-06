'use client';

import { usePathname } from 'next/navigation';
import pkg from '../../package.json';
import { PATH_TITLE_MAP } from '@/lib/constant';

export default function PageMetadata() {
  const pathName = usePathname();

  // 生成页面标题
  const pageTitle = (() => {
    const customTitle = PATH_TITLE_MAP[pathName];
    const titleSuffix = pkg.name.toUpperCase();
    if (pathName === '/') {
      return titleSuffix;
    }
    return customTitle
      ? `${customTitle} | ${titleSuffix}`
      : `${pathName.slice(1).toUpperCase()} | ${titleSuffix}`;
  })();
  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={pkg.description} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pkg.description} />
      <meta property="og:type" content="website" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pkg.description} />
    </>
  );
}
