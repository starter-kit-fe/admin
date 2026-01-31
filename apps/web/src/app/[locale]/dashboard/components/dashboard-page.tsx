'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useIsHydrated } from '@/hooks/use-is-hydrated';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

export function DashboardPage() {
  const t = useTranslations('Dashboard');
  const { permissions } = usePermissions();
  const isHydrated = useIsHydrated();
  const sortedPermissions = useMemo(
    () => [...permissions].sort((a, b) => a.localeCompare(b)),
    [permissions],
  );

  const ownedCount = isHydrated ? sortedPermissions.length : 0;

  return (
    <div className="space-y-6">
      <Card className="shadow-none border-none">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description', { count: ownedCount })}</CardDescription>
        </CardHeader>
        <CardContent>
          {!isHydrated ? (
            <p className="text-sm text-muted-foreground">{t('loading')}</p>
          ) : sortedPermissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {sortedPermissions.map((code) => (
                <div
                  key={code}
                  className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs sm:text-sm">{code}</span>
                  <Badge>{t('badge')}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
