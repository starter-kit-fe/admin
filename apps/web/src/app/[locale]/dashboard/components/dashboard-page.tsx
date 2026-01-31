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
import { useMemo } from 'react';

export function DashboardPage() {
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
          <CardTitle>权限列表</CardTitle>
          <CardDescription>{`当前账号共 ${ownedCount} 项权限。`}</CardDescription>
        </CardHeader>
        <CardContent>
          {!isHydrated ? (
            <p className="text-sm text-muted-foreground">权限信息加载中...</p>
          ) : sortedPermissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">当前账号暂无权限。</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {sortedPermissions.map((code) => (
                <div
                  key={code}
                  className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs sm:text-sm">{code}</span>
                  <Badge>已拥有</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
