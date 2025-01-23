'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { ID_LOOKUP_GROUP, ID_LOOKUP_LIST } from '@/lib/constant';

import { useStore } from '../_store';
import { getList, getGroups } from '../_api';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import FilterBar from './filter-bar';
import Group from './group';
import Table from './table';
import LoadingShow from '@/components/loading-show';

export default function Page() {
  const { params, groupParams, currentGroup, setCurrentGroup } = useStore();
  // 分组
  const { data: groupData, isLoading: groupLoading } = useQuery({
    queryKey: [ID_LOOKUP_GROUP, groupParams],
    queryFn: () =>
      getGroups({
        ...groupParams,
        status: groupParams.status === 'all' ? '' : groupParams.status,
      }),
  });
  // 数据
  const { data, isLoading: listLoading } = useQuery({
    queryKey: [ID_LOOKUP_LIST, params, currentGroup?.value],
    queryFn: () =>
      getList(currentGroup?.value || '', {
        ...params,
        status: params.status === 'all' ? '' : params.status,
      }),
    enabled: Boolean(currentGroup?.value),
  });

  useEffect(() => {
    if (!currentGroup && groupData?.list?.length) {
      setCurrentGroup(groupData.list[0]);
    }
  }, [currentGroup, groupData?.list, setCurrentGroup]);

  // let GroupUI = null;
  // if (groupData?.list) GroupUI = <Group data={groupData} />;
  const groupUI = groupData?.list ? <Group data={groupData} /> : null;
  const tableData = data?.list?.sort((a, b) => a.sort - b.sort) ?? [];
  const isLoading = groupLoading || listLoading;

  return (
    <Card>
      <CardHeader>
        <FilterBar />
      </CardHeader>
      <CardContent>
        {/* <LoadingShow when={!groupLoading || !isLoading} > */}
        <div className="flex gap-2">
          <div className="w-[220px] border-r pr-2 hidden xl:block">
            <LoadingShow when={!groupLoading}>{groupUI}</LoadingShow>
          </div>
          <div className="flex-1 w-full">
            <LoadingShow when={!isLoading}>
              <Table data={tableData} />
            </LoadingShow>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
