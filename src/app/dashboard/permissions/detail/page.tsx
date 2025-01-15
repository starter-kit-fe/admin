'use client';
import Show from '@/components/show';
import { useDetail } from '../_hook';
import Loading from '@/app/dashboard/loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatISOTime } from '@/lib/format-ios-time';
import { IconCard } from '../create/_components/icon/card';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const search = useSearchParams();
  const id = search.get('id');
  const { isLoading, data } = useDetail(Number(id));

  if (!data) return <Loading />;
  return (
    <Show when={!isLoading} fallback={<Loading />}>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            &quot;{data.name.toUpperCase()}&quot;&nbsp;详情
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{`${data.type.label}`}</Badge>
            <Badge variant="outline">{`${data.status.label}`}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm ">
          <div className="grid grid-cols-2 gap-4 border-t pt-4 text-muted-foreground">
            <div>
              <h3 className="text-sm font-medium ">父节点</h3>
              <Link
                href={`/dashboard/permissions/detail?id=${data.parent.id}`}
                target="_blank"
              >
                <p>{data.parent.name}</p>
              </Link>
            </div>
            <div>
              <h3 className="text-sm font-medium ">路径</h3>
              <p>{data.path || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium ">权限标识</h3>
              <p>{data.perms}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium ">图标</h3>
              <p>
                <IconCard
                  iconName={data.icon as keyof typeof dynamicIconImports}
                />{' '}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium ">拍序</h3>
              <p>{data.sort}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium ">是否外链</h3>
              <p>{data.isFrame.label}</p>
            </div>
          </div>
          <div className=" text-muted-foreground">
            <h3 className="text-sm font-medium ">备注</h3>
            <p>{data.remark || 'No remark'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4 text-muted-foreground">
            <div className="flex items-center space-x-2">
              <span className="font-medium">创建时间:</span>
              <span>{formatISOTime(data?.createdAt ?? '')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium ">更新时间:</span>
              <span>{formatISOTime(data?.updatedAt ?? '')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Show>
  );
}
