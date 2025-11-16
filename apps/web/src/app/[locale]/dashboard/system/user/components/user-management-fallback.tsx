'use client';

import { useTranslations } from 'next-intl';

export function UserManagementFallback() {
  const t = useTranslations('UserManagement.page');
  return (
    <div className="p-4 text-sm text-muted-foreground">
      {t('loading')}
    </div>
  );
}
