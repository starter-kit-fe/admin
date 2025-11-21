'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useTranslations } from 'next-intl';

import { getOnlineUserDetail } from '../../api';
import { ONLINE_USERS_QUERY_KEY } from '../../constants';
import { useOnlinePermissionFlags } from '../../hooks';
import { useOnlineUserManagementStore } from '../../store';
import {
  resolveOnlineUserIdentifier,
  resolveStatusBadgeVariant,
} from '../../utils';

export function OnlineUserDetailDialog() {
  const t = useTranslations('OnlineUserManagement');
  const { detailDialog, closeDetailDialog } =
    useOnlineUserManagementStore();
  const { canQuery } = useOnlinePermissionFlags();

  const identifier = detailDialog.open
    ? resolveOnlineUserIdentifier(detailDialog.user)
    : null;

  const query = useQuery({
    queryKey: [...ONLINE_USERS_QUERY_KEY, 'detail', identifier],
    queryFn: async () => {
      if (!identifier) {
        throw new Error(t('errors.missingDetail'));
      }
      return getOnlineUserDetail(identifier);
    },
    enabled: Boolean(canQuery && detailDialog.open && identifier),
    staleTime: 60 * 1000,
  });

  const detail = query.data ?? (detailDialog.open ? detailDialog.user : null);
  const isLoading = query.isLoading && !detail;
  const hasError = query.isError && !detail;
  const description = detail
    ? t('detail.description.named', {
        name: detail.userName || t('detail.unnamed'),
      })
    : t('detail.description.generic');

  const statusBadge = detail ? (
    <Badge variant={resolveStatusBadgeVariant(detail.status)}>
      {detail.status === '0' || !detail.status
        ? t('status.online')
        : t('status.abnormal')}
    </Badge>
  ) : (
    '—'
  );

  const sessionFields = useMemo(() => {
    if (!detail) {
      return [];
    }
    return [
      { label: t('detail.fields.userName'), value: detail.userName || '—' },
      { label: t('detail.fields.nickName'), value: detail.nickName || '—' },
      { label: t('detail.fields.deptName'), value: detail.deptName || '—' },
      { label: t('detail.fields.status'), value: statusBadge },
      { label: t('detail.fields.ipaddr'), value: detail.ipaddr || '—' },
      {
        label: t('detail.fields.loginLocation'),
        value: detail.loginLocation || '—',
      },
      { label: t('detail.fields.loginTime'), value: detail.loginTime || '—' },
      {
        label: t('detail.fields.lastAccessTime'),
        value: detail.lastAccessTime || '—',
      },
      { label: t('detail.fields.browser'), value: detail.browser || '—' },
      { label: t('detail.fields.os'), value: detail.os || '—' },
      {
        label: t('detail.fields.sessionId'),
        value: detail.sessionId || detail.tokenId || '—',
      },
      { label: t('detail.fields.tokenId'), value: detail.tokenId || '—' },
      { label: t('detail.fields.uuid'), value: detail.uuid || '—' },
    ];
  }, [detail, statusBadge, t]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeDetailDialog();
    }
  };

  if (!canQuery) {
    return null;
  }

  return (
    <ResponsiveDialog open={detailDialog.open} onOpenChange={handleOpenChange}>
      <ResponsiveDialog.Content className="sm:max-w-xl">
        <ResponsiveDialog.Header>
          <ResponsiveDialog.Title>{t('detail.title')}</ResponsiveDialog.Title>
          <ResponsiveDialog.Description>
            {description}
          </ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <InlineLoading label={t('detail.loading')} />
            </div>
          ) : hasError ? (
            <div className="rounded-lg border border-dashed border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
              {t('detail.error')}
            </div>
          ) : detail ? (
            <>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                {sessionFields.map((field) => (
                  <div key={field.label} className="space-y-1">
                    <dt className="text-xs text-muted-foreground">
                      {field.label}
                    </dt>
                    <dd className="font-medium text-foreground">
                      {field.value ?? '—'}
                    </dd>
                  </div>
                ))}
              </dl>
              {detail.msg ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {t('detail.statusLabel')}
                  </p>
                  <p className="rounded-md bg-muted/60 px-3 py-2 text-sm text-foreground">
                    {detail.msg}
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              {t('detail.empty')}
            </div>
          )}
        </div>
        <ResponsiveDialog.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => closeDetailDialog()}
          >
            {t('detail.close')}
          </Button>
        </ResponsiveDialog.Footer>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}
