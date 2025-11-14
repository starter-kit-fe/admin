import { CookieConsentBanner } from '@/components/cookie-consent-banner';
import { Providers } from '@/components/providers';
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Script from 'next/script';

import pkg from '../../package.json';
import './globals.css';

const font = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const metadataBase = (() => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? pkg.seo.og.url;
  try {
    return baseUrl ? new URL(baseUrl) : undefined;
  } catch {
    return undefined;
  }
})();

export const metadata: Metadata = {
  title: pkg.seo.title,
  description: pkg.seo.description,
  keywords: pkg.seo.keywords,
  ...(metadataBase ? { metadataBase } : {}),
  openGraph: {
    title: pkg.seo.og.title,
    description: pkg.seo.og.description,
    url: pkg.seo.og.url,
    type: pkg.seo.og.type as 'website',
    images: pkg.seo.og.image,
  },
  twitter: {
    card: pkg.seo.twitter.card as 'summary_large_image',
    title: pkg.seo.twitter.title,
    description: pkg.seo.twitter.description,
    images: pkg.seo.twitter.image,
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    shortcut: ['/favicon-32x32.png'],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
        <meta name="renderer" content="webkit" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          rel="icon"
          href="/favicon-32x32.png"
          type="image/png"
          sizes="32x32"
        />
        <link
          rel="icon"
          href="/favicon-16x16.png"
          type="image/png"
          sizes="16x16"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof globalThis.__name !== 'function') {
                Object.defineProperty(globalThis, '__name', {
                  value: function (target, value) {
                    try {
                      Object.defineProperty(target, 'name', { value, configurable: true });
                    } catch {}
                    return target;
                  },
                  configurable: true,
                  writable: true,
                });
              }
            `,
          }}
        />

        {pkg.seo.jsonLd && (
          <Script
            id="onefile-jsonld"
            type="application/ld+json"
            // 保持纯字符串注入，符合 Google / Next.js 推荐
            dangerouslySetInnerHTML={{ __html: JSON.stringify(pkg.seo.jsonLd) }}
            strategy="beforeInteractive"
          />
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var isIE = /MSIE|Trident/.test(navigator.userAgent);
                var isOldIE = /MSIE [1-9]\\.|MSIE 10\\./.test(navigator.userAgent);
                if (isOldIE) {
                  window.location.href = '/ie.html';
                }
              })();
            `,
          }}
        />
      </head>
      <body className={font.className} suppressHydrationWarning>
        <Providers>
          <>
            {children}
            <CookieConsentBanner />
          </>
        </Providers>
      </body>
    </html>
  );
}
