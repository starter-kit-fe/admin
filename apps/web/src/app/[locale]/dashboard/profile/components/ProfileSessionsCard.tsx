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
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('Profile');

  return (
    <Card className="shadow-none  border-none">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{t('sessions.title')}</CardTitle>
          <CardDescription>{t('sessions.description')}</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing
            ? t('sessions.refresh.pending')
            : t('sessions.refresh.idle')}
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
            {t('sessions.states.error')}
          </p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('sessions.states.empty')}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('sessions.table.device')}</TableHead>
                <TableHead>{t('sessions.table.location')}</TableHead>
                <TableHead>{t('sessions.table.time')}</TableHead>
                <TableHead className="text-right">
                  {t('sessions.table.actions')}
                </TableHead>
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
                        {session.browser || t('sessions.fallbacks.browser')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {session.os || t('sessions.fallbacks.os')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{session.ipaddr || t('sessions.fallbacks.ip')}</div>
                      <div className="text-xs text-muted-foreground">
                        {session.loginLocation ||
                          t('sessions.fallbacks.location')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{session.loginTime || t('sessions.fallbacks.time')}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('sessions.lastActive', {
                          time:
                            session.lastAccessTime ||
                            t('sessions.fallbacks.time'),
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!actionId || isPending}
                        onClick={() => onForceLogout(actionId)}
                      >
                        {isPending
                          ? t('sessions.action.pending')
                          : t('sessions.action.forceLogout')}
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
