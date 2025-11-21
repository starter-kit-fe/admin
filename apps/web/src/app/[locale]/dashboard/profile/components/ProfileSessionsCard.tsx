import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { OnlineUser } from '../../monitor/online/type';

type ProfileSessionsCardProps = {
  sessions: OnlineUser[];
  isLoading: boolean;
  isError: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onForceLogout: (sessionId: string) => void;
  pendingSessionId: string | null;
};

export function ProfileSessionsCard({
  sessions,
  isLoading,
  isError,
  isRefreshing,
  onRefresh,
  onForceLogout,
  pendingSessionId,
}: ProfileSessionsCardProps) {
  return (
    <Card className="shadow-none  border-none">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>登录会话</CardTitle>
          <CardDescription>
            查看并管理当前账号在不同设备上的登录状态。
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? '刷新中...' : '刷新列表'}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-5 w-44" />
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">
            获取会话信息失败，请稍后重试。
          </p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            目前没有其他登录会话。
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>设备信息</TableHead>
                <TableHead>IP / 地点</TableHead>
                <TableHead>时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session, index) => {
                const identifier =
                  resolveSessionId(session) || `session-${index}`;
                const actionId = session.sessionId?.trim() ?? '';
                const isPending =
                  pendingSessionId !== null && pendingSessionId === actionId;
                return (
                  <TableRow key={identifier}>
                    <TableCell>
                      <div className="font-medium">
                        {session.browser || '未知浏览器'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {session.os || '未知系统'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{session.ipaddr || '未知 IP'}</div>
                      <div className="text-xs text-muted-foreground">
                        {session.loginLocation || ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{session.loginTime || '-'}</div>
                      <div className="text-xs text-muted-foreground">
                        上次活跃：{session.lastAccessTime || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!actionId || isPending}
                        onClick={() => onForceLogout(actionId)}
                      >
                        {isPending ? '处理中...' : '强制下线'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function resolveSessionId(session: OnlineUser) {
  if (session.sessionId && session.sessionId.trim()) {
    return session.sessionId.trim();
  }
  if (session.tokenId && session.tokenId.trim()) {
    return session.tokenId.trim();
  }
  if (session.uuid && session.uuid.trim()) {
    return session.uuid.trim();
  }
  if (typeof session.infoId === 'number') {
    return String(session.infoId);
  }
  return '';
}
