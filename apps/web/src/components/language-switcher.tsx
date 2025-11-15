'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { useLocaleStore } from '@/stores';
import { LOCALE_PREFERENCE_KEY } from '@/i18n/preferences';
import { Check, Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

interface LanguageSwitcherProps {
  className?: string;
}

type LocaleOptionKey = `options.${AppLocale}`;

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('LanguageSwitcher');
  const { setLocalePreference } = useLocaleStore();

  const searchString = useMemo(
    () => searchParams?.toString() ?? '',
    [searchParams],
  );
  const pathWithSearch = useMemo(() => {
    const safePath = pathname ?? '/';
    return searchString ? `${safePath}?${searchString}` : safePath;
  }, [pathname, searchString]);

  const getLocaleLabel = (value: AppLocale) =>
    t(`options.${value}` as LocaleOptionKey);

  const handleLocaleChange = (nextLocale: AppLocale) => {
    if (nextLocale === locale) {
      return;
    }
    const targetPath = pathWithSearch || '/';
    setLocalePreference(nextLocale);
    if (typeof document !== 'undefined') {
      document.cookie = `${LOCALE_PREFERENCE_KEY}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    }
    router.replace(targetPath, { locale: nextLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn('relative size-10 rounded-full', className)}
          aria-label={t('label')}
        >
          <Languages className="h-[1.1rem] w-[1.1rem]" />
          <span className="sr-only">{t('label')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t('label')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {routing.locales.map((value) => {
          const isActive = value === locale;
          return (
            <DropdownMenuItem
              key={value}
              onSelect={(event) => {
                event.preventDefault();
                handleLocaleChange(value);
              }}
              className="flex items-center gap-2"
            >
              <span className="flex-1 text-sm">
                {getLocaleLabel(value)}
              </span>
              {isActive ? (
                <Check className="h-4 w-4 text-primary" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
