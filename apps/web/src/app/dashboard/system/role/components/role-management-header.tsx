import { RefreshCw, ShieldPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RoleManagementHeaderProps {
  onRefresh: () => void;
  onCreate: () => void;
  disableActions?: boolean;
  isRefreshing?: boolean;
}

export function RoleManagementHeader({ onRefresh, onCreate, disableActions, isRefreshing }: RoleManagementHeaderProps) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-xl font-semibold">角色管理</CardTitle>
          <CardDescription>维护系统角色、权限字符以及数据权限范围。</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={disableActions}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button type="button" onClick={onCreate} disabled={disableActions} className="flex items-center gap-2">
            <ShieldPlus className="size-4" />
            新建角色
          </Button>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        角色用于聚合权限，可关联菜单和数据范围。请谨慎修改内置角色。
      </CardContent>
    </Card>
  );
}
