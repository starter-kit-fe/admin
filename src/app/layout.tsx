import './globals.css';
import { Metadata, Viewport } from 'next';
import Providers from '@/components/providers';
import pkg from '../../package.json';
import BuildInfo from '@/components/build-info';

export const metadata: Metadata = {
  title: {
    default: pkg.name,
    template: `%s - ${pkg.name}`,
  },
  metadataBase: new URL('https://tigerzh.com'),
  description: pkg.description,
  keywords: [
    'Admin',
    'React',
    'Tailwind CSS',
    'Server Components',
    'Dashboard',
  ],
  authors: [
    {
      name: 'rirh<i@tigerzh.com>',
      url: 'https://tigerzh.com',
    },
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    // url: siteConfig.url,
    title: pkg.name,
    description: pkg.description,
    siteName: pkg.name,
    images: [
      {
        url: '/pwa-512x512.png',
        width: 1200,
        height: 630,
        alt: pkg.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: pkg.name,
    description: pkg.description,
    images: ['/pwa-512x512.png'],
    creator: '@rirh',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: `/site.webmanifest`,
};
interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
        <meta name="renderer" content="webkit" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        {/* <!--[if lt IE 11]><script>window.location.href='/ie.html';</script><![endif]--> */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.querySelector('meta[name="theme-color"]').setAttribute('content', '#09090b')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`antialiased min-h-svh bg-background font-sans`}>
        <Providers> {children}</Providers>
        <BuildInfo />
      </body>
    </html>
  );
}
