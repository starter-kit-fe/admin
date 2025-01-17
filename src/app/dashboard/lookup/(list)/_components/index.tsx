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
  const { data: groupData, isLoading: groupLoading } = useQuery({
    queryKey: [ID_LOOKUP_GROUP, groupParams],
    queryFn: () => getGroups(groupParams),
  });
  const { data, isLoading } = useQuery({
    queryKey: [ID_LOOKUP_LIST, params, currentGroup?.value],
    queryFn: () => getList(currentGroup?.value || '', params),
    enabled: !!currentGroup?.value,
  });
  useEffect(() => {
    if (!currentGroup && groupData?.list) setCurrentGroup(groupData.list[0]);
  }, [groupData]);
  let GroupUI = null;
  if (groupData?.list) GroupUI = <Group data={groupData} />;
  const tableData = data?.list?.sort((a, b) => a.sort - b.sort) ?? [];
  return (
    <Card>
      <CardHeader>
        <FilterBar />
      </CardHeader>
      <CardContent>
        {/* <LoadingShow when={!groupLoading || !isLoading} > */}
        <div className="flex gap-2">
          <div className=" max-w-[220px] border-r pr-2 hidden xl:block">
            <LoadingShow when={!groupLoading}>{GroupUI}</LoadingShow>
          </div>
          <div className="flex-1 w-full">
            <LoadingShow when={!groupLoading && !isLoading}>
              <Table data={tableData} />
            </LoadingShow>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
