import createMiddleware from 'next-intl/middleware';

import {routing} from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    '/',
    '/(zh|en)/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|site\\.webmanifest|robots\\.txt|sitemap\\.xml|ie\\.html).*)',
  ],
};
