'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';

import { getOnlineUserDetail } from '../../api';
import { ONLINE_USERS_QUERY_KEY } from '../../constants';
import { useOnlinePermissionFlags } from '../../hooks';
import { useOnlineUserManagementStore } from '../../store';
import {
  resolveOnlineUserIdentifier,
  resolveStatusBadgeVariant,
} from '../../utils';

export function OnlineUserDetailDialog() {
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
        throw new Error('缺少会话标识，无法查询详情');
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
    ? `账号 ${detail.userName || '未命名'} 的会话详情`
    : '查看在线会话详情';

  const statusBadge = detail ? (
    <Badge variant={resolveStatusBadgeVariant(detail.status)}>
      {detail.status === '0' || !detail.status ? '在线' : '异常'}
    </Badge>
  ) : (
    '—'
  );

  const sessionFields = useMemo(() => {
    if (!detail) {
      return [];
    }
    return [
      { label: '登录账号', value: detail.userName || '—' },
      { label: '用户昵称', value: detail.nickName || '—' },
      { label: '所属部门', value: detail.deptName || '—' },
      { label: '当前状态', value: statusBadge },
      { label: '登录 IP', value: detail.ipaddr || '—' },
      { label: '登录地点', value: detail.loginLocation || '—' },
      { label: '登录时间', value: detail.loginTime || '—' },
      { label: '最近活跃', value: detail.lastAccessTime || '—' },
      { label: '浏览器', value: detail.browser || '—' },
      { label: '操作系统', value: detail.os || '—' },
      { label: '会话 ID', value: detail.sessionId || detail.tokenId || '—' },
      { label: 'Token ID', value: detail.tokenId || '—' },
      { label: 'UUID', value: detail.uuid || '—' },
    ];
  }, [detail, statusBadge]);

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
          <ResponsiveDialog.Title>会话详情</ResponsiveDialog.Title>
          <ResponsiveDialog.Description>
            {description}
          </ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <InlineLoading label="正在加载会话详情..." />
            </div>
          ) : hasError ? (
            <div className="rounded-lg border border-dashed border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
              加载详情失败，请稍后重试。
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
                  <p className="text-xs text-muted-foreground">状态描述</p>
                  <p className="rounded-md bg-muted/60 px-3 py-2 text-sm text-foreground">
                    {detail.msg}
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              未找到该会话，可能已下线。
            </div>
          )}
        </div>
        <ResponsiveDialog.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => closeDetailDialog()}
          >
            关闭
          </Button>
        </ResponsiveDialog.Footer>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}
