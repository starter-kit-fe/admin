'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';

import { getOnlineUserDetail } from '../api';
import { ONLINE_USERS_QUERY_KEY } from '../constants';
import { useOnlinePermissionFlags } from '../hooks';
import { useOnlineUserManagementStore } from '../store';
import {
  resolveOnlineUserIdentifier,
  resolveStatusBadgeVariant,
} from '../utils';

export function OnlineUserDetailDialog() {
  const { detailDialog, closeDetailDialog } =
    useOnlineUserManagementStore();
  const { canQuery } = useOnlinePermissionFlags();
  const tDetail = useTranslations('OnlineUserManagement.detail');
  const tStatus = useTranslations('OnlineUserManagement.status');
  const tErrors = useTranslations('OnlineUserManagement.errors');

  const identifier = detailDialog.open
    ? resolveOnlineUserIdentifier(detailDialog.user)
    : null;

  const query = useQuery({
    queryKey: [...ONLINE_USERS_QUERY_KEY, 'detail', identifier],
    queryFn: async () => {
      if (!identifier) {
        throw new Error(tErrors('missingDetail'));
      }
      return getOnlineUserDetail(identifier);
    },
    enabled: Boolean(canQuery && detailDialog.open && identifier),
    staleTime: 60 * 1000,
  });

  const detail = query.data ?? (detailDialog.open ? detailDialog.user : null);
  const isLoading = query.isLoading && !detail;
  const hasError = query.isError && !detail;
  const unnamedFallback = tDetail('unnamed');
  const description = detail
    ? tDetail('description.named', {
        name: detail.userName || unnamedFallback,
      })
    : tDetail('description.generic');

  const statusBadge = detail ? (
    <Badge variant={resolveStatusBadgeVariant(detail.status)}>
      {detail.status === '0' || !detail.status
        ? tStatus('online')
        : tStatus('abnormal')}
    </Badge>
  ) : (
    '—'
  );

  const sessionFields = useMemo(() => {
    if (!detail) {
      return [];
    }
    return [
      { label: tDetail('fields.userName'), value: detail.userName || '—' },
      { label: tDetail('fields.nickName'), value: detail.nickName || '—' },
      { label: tDetail('fields.deptName'), value: detail.deptName || '—' },
      { label: tDetail('fields.status'), value: statusBadge },
      { label: tDetail('fields.ipaddr'), value: detail.ipaddr || '—' },
      {
        label: tDetail('fields.loginLocation'),
        value: detail.loginLocation || '—',
      },
      { label: tDetail('fields.loginTime'), value: detail.loginTime || '—' },
      {
        label: tDetail('fields.lastAccessTime'),
        value: detail.lastAccessTime || '—',
      },
      { label: tDetail('fields.browser'), value: detail.browser || '—' },
      { label: tDetail('fields.os'), value: detail.os || '—' },
      {
        label: tDetail('fields.sessionId'),
        value: detail.sessionId || detail.tokenId || '—',
      },
      { label: tDetail('fields.tokenId'), value: detail.tokenId || '—' },
      { label: tDetail('fields.uuid'), value: detail.uuid || '—' },
    ];
  }, [detail, statusBadge, tDetail]);

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
          <ResponsiveDialog.Title>{tDetail('title')}</ResponsiveDialog.Title>
          <ResponsiveDialog.Description>
            {description}
          </ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <InlineLoading label={tDetail('loading')} />
            </div>
          ) : hasError ? (
            <div className="rounded-lg border border-dashed border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
              {tDetail('error')}
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
                    {tDetail('statusLabel')}
                  </p>
                  <p className="rounded-md bg-muted/60 px-3 py-2 text-sm text-foreground">
                    {detail.msg}
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              {tDetail('empty')}
            </div>
          )}
        </div>
        <ResponsiveDialog.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => closeDetailDialog()}
          >
            {tDetail('close')}
          </Button>
        </ResponsiveDialog.Footer>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}
