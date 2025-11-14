'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

const CONSENT_STORAGE_KEY = 'admin_cookie_consent';
const CONSENT_COOKIE_NAME = 'admin_cookie_consent';

function getStoredConsent() {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (value === 'accepted') {
      return true;
    }
  } catch {
    // ignore read errors
  }

  if (typeof document !== 'undefined') {
    return document.cookie
      .split(';')
      .map((entry) => entry.trim())
      .some((entry) => entry === `${CONSENT_COOKIE_NAME}=accepted`);
  }
  return false;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!getStoredConsent());
  }, []);

  const persistConsent = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
      } catch {
        // ignore write errors
      }
    }
    if (typeof document !== 'undefined') {
      document.cookie = `${CONSENT_COOKIE_NAME}=accepted; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, []);

  const handleAccept = () => {
    persistConsent();
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-4 sm:px-6 sm:pb-8">
      <Card className="pointer-events-auto w-full max-w-4xl border-border/70 bg-background/95 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">
              我们使用 Cookie
            </p>
            <p className="text-sm text-muted-foreground">
              为了提供更佳的体验，我们会使用必要的
              Cookie。继续浏览即表示你同意。
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              className="justify-center"
            >
              <Link href="/privacy">了解更多</Link>
            </Button>
            <Button type="button" size="sm" onClick={handleAccept}>
              我已知晓
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
