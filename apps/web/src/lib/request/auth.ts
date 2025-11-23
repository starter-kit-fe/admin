import { DEFAULT_UNAUTHORIZED_MESSAGE } from './constants';
import { isLoginPathname, resolveLoginRoute } from './locale';
import { showSessionExpiredDialog } from './session-dialog';

const REFRESH_PATH = '/v1/auth/refresh';

let refreshPromise: Promise<boolean> | null = null;
let hasTriggeredUnauthorizedRedirect = false;

function normalizeBaseURL(baseURL?: string): string {
  const base = baseURL || process.env.NEXT_PUBLIC_API_URL || '/api';
  return base.replace(/\/$/, '');
}

function buildRefreshURL(baseURL?: string) {
  const normalizedBase = normalizeBaseURL(baseURL);
  return `${normalizedBase}${REFRESH_PATH.startsWith('/') ? '' : '/'}${REFRESH_PATH}`;
}

export function shouldAttemptAuthRefresh(url: string) {
  const normalized = url.toLowerCase();
  return (
    !normalized.includes('/auth/login') &&
    !normalized.includes('/auth/refresh')
  );
}

export async function refreshAuthToken(baseURL?: string): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }
  const refreshURL = buildRefreshURL(baseURL);
  refreshPromise = fetch(refreshURL, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
    .then(async (response) => {
      if (!response.ok) {
        return false;
      }
      const payload = await response
        .json()
        .catch(() => ({ code: response.status }));
      if (
        payload &&
        typeof payload.code === 'number' &&
        payload.code !== 200
      ) {
        return false;
      }
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

export function handleUnauthorizedRedirect(
  message?: string,
  clearToken?: () => void,
) {
  clearToken?.();

  const fallbackMessage =
    message && message.trim().length > 0
      ? message
      : DEFAULT_UNAUTHORIZED_MESSAGE;

  if (typeof window === 'undefined') {
    throw new Error(fallbackMessage);
  }

  try {
    localStorage.clear();
  } catch {
    // ignore storage clear failures (e.g. disabled storage)
  }

  const pathname = window.location.pathname;
  const loginRoute = resolveLoginRoute(pathname);
  const alreadyOnLogin = isLoginPathname(pathname);
  if (alreadyOnLogin) {
    return;
  }

  if (hasTriggeredUnauthorizedRedirect) {
    return;
  }

  hasTriggeredUnauthorizedRedirect = true;
  const currentUrl = pathname + window.location.search + window.location.hash;
  const redirectParam = encodeURIComponent(currentUrl || '/');
  const target = `${loginRoute}?redirect=${redirectParam}`;

  showSessionExpiredDialog({
    message: fallbackMessage,
    onConfirm: () => {
      window.location.replace(target);
    },
    onCancel: () => {
      hasTriggeredUnauthorizedRedirect = false;
    },
  });
}
