import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('Profile');

  return (
    <Card className="shadow-none  border-none">
      <CardHeader>
        <CardTitle>{t('security.title')}</CardTitle>
        <CardDescription>{t('security.description')}</CardDescription>
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
              <dt className="text-muted-foreground">
                {t('security.items.lastLoginAt')}
              </dt>
              <dd className="font-medium text-foreground">{lastLoginAt}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-muted-foreground">
                {t('security.items.lastLoginIp')}
              </dt>
              <dd className="font-medium text-foreground">{lastLoginIp}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-muted-foreground">
                {t('security.items.lastPasswordChange')}
              </dt>
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
