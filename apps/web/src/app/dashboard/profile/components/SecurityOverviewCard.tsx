import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type SecurityOverviewCardProps = {
  isLoading: boolean;
  lastLoginAt: string;
  lastLoginIp: string;
  lastPasswordChange: string;
};

export function SecurityOverviewCard({
  isLoading,
  lastLoginAt,
  lastLoginIp,
  lastPasswordChange,
}: SecurityOverviewCardProps) {
  return (
    <Card className="shadow-none  border-none">
      <CardHeader>
        <CardTitle>安全概览</CardTitle>
        <CardDescription>快速确认账号最近一次登录与安全操作。</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-48" />
          </div>
        ) : (
          <dl className="space-y-4 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-muted-foreground">最近登录时间</dt>
              <dd className="font-medium text-foreground">{lastLoginAt}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-muted-foreground">上次登录 IP</dt>
              <dd className="font-medium text-foreground">{lastLoginIp}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-muted-foreground">上次修改密码</dt>
              <dd className="font-medium text-foreground">
                {lastPasswordChange}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
