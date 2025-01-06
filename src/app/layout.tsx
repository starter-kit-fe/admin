import './globals.css';
import Providers from '@/components/providers';
import pkg from '../../package.json';
import BuildInfo from '@/components/build-info';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
        <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
        <meta name="renderer" content="webkit" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        {/* <!--[if lt IE 11]><script>window.location.href='/ie.html';</script><![endif]--> */}
        <title>{pkg.name}</title>
        <meta name="description" content={pkg.description} />
      </head>
      <body className={`antialiased`}>
        <Providers> {children}</Providers>
        <BuildInfo />
      </body>
    </html>
  );
}
