'use client';
import { get } from '../_api';
import Show from '@/components/show';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import Loading from '@/app/dashboard/loading';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hash, Group, Activity } from 'lucide-react';
import { formatISOTime } from '@/lib/format-ios-time';
import Copy from '@/components/copy';

export default function Page() {
  const search = useSearchParams();
  const id = search.get('id');
  const { data, isLoading, error } = useQuery({
    queryKey: [id],
    queryFn: () => get(`${id}`),
  });

  if (error) throw error;
  return (
    <Show when={!isLoading} fallback={<Loading />}>
      <div className=" p-8">
        <title>{data?.label?.toUpperCase()}详情</title>
        <Card className=" max-w-6xl mx-auto">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">
                &quot;{data?.label?.toUpperCase()}&quot; 详情
              </CardTitle>
              <Badge
                variant={data?.isActive ? 'default' : 'destructive'}
                className="ml-2"
              >
                {data?.isActive ? '激活' : '未激活'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 text-sm">
            {/* Primary Information */}
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">编号:</span>
                  <span>{data?.id}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Group className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">所属分组:</span>
                  <span>{data?.group?.toUpperCase()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">键值:</span>
                </div>
                <div className=" bg-gray-100 p-3 rounded-lg break-all relative">
                  {data?.value}
                  <Copy
                    className="absolute bottom-1 right-1 h-[20px]"
                    text={data?.value ?? ''}
                  />
                </div>
              </div>
            </div>

            {/* Secondary Information */}

            {/* Timestamps */}
            <div className="grid grid-cols-1 gap-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <span className="font-medium">创建者:</span>
                <span>{data?.creator || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">最近更新者:</span>
                <span>{data?.updator || 'N/A'}</span>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <span className="font-medium">创建时间:</span>
                <span>{formatISOTime(data?.createdAt ?? '')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">更新时间:</span>
                <span>{formatISOTime(data?.updatedAt ?? '')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Show>
  );
}
