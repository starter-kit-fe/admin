import { Providers } from "@/components/providers";
import { getPageMap } from "nextra/page-map";
import { Layout } from "nextra-theme-docs";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";

import pkg from "../../package.json";
import themeConfig from "../../theme.config";
import "nextra-theme-docs/style.css";
import "./globals.css";
const font = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: pkg.seo.title,
  description: pkg.seo.description,
  keywords: pkg.seo.keywords,
  openGraph: {
    title: pkg.seo.og.title,
    description: pkg.seo.og.description,
    url: pkg.seo.og.url,
    type: pkg.seo.og.type as "website",
    images: pkg.seo.og.image,
  },
  twitter: {
    card: pkg.seo.twitter.card as "summary_large_image",
    title: pkg.seo.twitter.title,
    description: pkg.seo.twitter.description,
    images: pkg.seo.twitter.image,
  },
  // 建议与 og.url 同步，利于生成绝对 URL
  metadataBase: new URL(pkg.seo.og.url),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pageMap = await getPageMap();

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
        <link rel="manifest" href="/site.webmanifest" />
        <meta
          name="theme-color"
          content="#FFFFFF"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#000000"
          media="(prefers-color-scheme: dark)"
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
        <Layout pageMap={pageMap} {...themeConfig}>
          <Providers>{children}</Providers>
        </Layout>
      </body>
    </html>
  );
}
