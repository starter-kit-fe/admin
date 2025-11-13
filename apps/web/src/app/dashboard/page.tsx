'use client';

import { PermissionButton } from '@/components/permission-button';
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
import { useAuthStore } from '@/stores';
import { useMemo } from 'react';

export default function DashboardPage() {
  const { user, roles } = useAuthStore();
  const { permissions } = usePermissions();
  const isHydrated = useIsHydrated();
  const sortedPermissions = useMemo(
    () => [...permissions].sort((a, b) => a.localeCompare(b)),
    [permissions],
  );

  const ownedCount = isHydrated ? sortedPermissions.length : 0;
  const assignedRoles = roles ?? [];
  const renderField = (value?: string | null, fallback = '未填写') => {
    if (!isHydrated) {
      return '加载中...';
    }
    if (typeof value !== 'string') {
      return fallback;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>当前账号</CardTitle>
          <CardDescription>
            登录成功后可在此查看账号基础信息、角色与权限概览。
          </CardDescription>
        </CardHeader>
        <CardContent>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">用户名</dt>
                  <dd className="font-medium">
                    {renderField(user?.userName, '未获取')}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">姓名</dt>
                  <dd className="font-medium">
                    {renderField(user?.nickName)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">邮箱</dt>
                  <dd className="font-medium">
                    {renderField(user?.email)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">手机号</dt>
                  <dd className="font-medium">
                    {renderField(user?.phonenumber)}
                  </dd>
                </div>
              </dl>
              <div className="mt-6 space-y-2">
                <p className="text-sm text-muted-foreground">角色</p>
                <div className="flex flex-wrap gap-2">
                  {!isHydrated ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      加载中...
                    </Badge>
                  ) : assignedRoles.length > 0 ? (
                    assignedRoles.map((role) => (
                      <Badge
                        key={role}
                    variant="secondary"
                    className="border border-primary/20 bg-primary/5 text-primary"
                  >
                    {role}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  暂无角色
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>权限按钮示例</CardTitle>
          <CardDescription>
            仅当拥有对应权限码时才会显示操作按钮，可用于任何需要鉴权的组件。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <PermissionButton required="system:user:add">
            创建用户
          </PermissionButton>
          <PermissionButton required="system:user:import" variant="outline">
            导入用户
          </PermissionButton>
          <PermissionButton
            required={['system:user:resetPwd']}
            variant="secondary"
          >
            重置密码
          </PermissionButton>
          <PermissionButton
            required={['monitor:job:add', 'monitor:job:changeStatus']}
            strategy="any"
            variant="ghost"
          >
            调度操作
          </PermissionButton>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>权限列表</CardTitle>
          <CardDescription>{`当前账号共 ${ownedCount} 项权限。`}</CardDescription>
        </CardHeader>
        <CardContent>
          {!isHydrated ? (
            <p className="text-sm text-muted-foreground">
              权限信息加载中...
            </p>
          ) : sortedPermissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              当前账号暂无权限。
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {sortedPermissions.map((code) => (
                <div
                  key={code}
                  className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs sm:text-sm">{code}</span>
                  <Badge className="border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/20 dark:text-emerald-100">
                    已拥有
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
