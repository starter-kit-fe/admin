'use client';

import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {usePathname, useRouter} from '@/i18n/navigation';
import type {AppLocale} from '@/i18n/routing';
import {routing} from '@/i18n/routing';
import {useLocale, useTranslations} from 'next-intl';

interface LanguageSwitcherProps {
  className?: string;
  size?: 'sm' | 'default';
}

export function LanguageSwitcher({className, size = 'default'}: LanguageSwitcherProps) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('LanguageSwitcher');

  const handleChange = (nextLocale: AppLocale) => {
    router.replace(pathname, {locale: nextLocale});
  };

  return (
    <Select value={locale} onValueChange={(value) => handleChange(value as AppLocale)}>
      <SelectTrigger
        aria-label={t('label')}
        className={className}
        size={size}
      >
        <SelectValue placeholder={t('label')} />
      </SelectTrigger>
      <SelectContent align="end">
        {routing.locales.map((value) => (
          <SelectItem key={value} value={value}>
            {t(`options.${value}` as 'options.zh' | 'options.en')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
