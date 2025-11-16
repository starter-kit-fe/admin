import type { AppLocale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';

import { LOGIN_ROUTE } from './constants';

const SUPPORTED_LOCALES = routing.locales;

export function isSupportedLocale(value?: string | null): value is AppLocale {
  if (typeof value !== 'string') {
    return false;
  }
  return SUPPORTED_LOCALES.includes(value as AppLocale);
}

export function extractLocaleFromPathname(
  pathname?: string | null,
): AppLocale | null {
  if (!pathname) {
    return null;
  }
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return null;
  }
  const candidate = segments[0];
  return isSupportedLocale(candidate) ? candidate : null;
}

export function buildLocalizedLoginRoute(locale?: string | null) {
  if (!locale || !isSupportedLocale(locale)) {
    return LOGIN_ROUTE;
  }
  return `/${locale}${LOGIN_ROUTE}`;
}

export function resolveLoginRoute(pathname?: string) {
  if (typeof window === 'undefined') {
    return LOGIN_ROUTE;
  }

  const localeFromPath = extractLocaleFromPathname(pathname);
  if (localeFromPath) {
    return buildLocalizedLoginRoute(localeFromPath);
  }

  if (typeof document !== 'undefined') {
    const lang = document.documentElement?.lang;
    if (isSupportedLocale(lang)) {
      return buildLocalizedLoginRoute(lang);
    }
  }

  return buildLocalizedLoginRoute(routing.defaultLocale);
}

export function isLoginPathname(pathname: string) {
  if (!pathname) {
    return false;
  }
  if (pathname === LOGIN_ROUTE || pathname.startsWith(`${LOGIN_ROUTE}/`)) {
    return true;
  }
  const locale = extractLocaleFromPathname(pathname);
  if (!locale) {
    return false;
  }
  const localizedLogin = buildLocalizedLoginRoute(locale);
  return (
    pathname === localizedLogin ||
    pathname.startsWith(`${localizedLogin}/`)
  );
}
