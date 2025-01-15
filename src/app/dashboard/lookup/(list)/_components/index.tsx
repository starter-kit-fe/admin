'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { ID_LOOKUP_GROUP, ID_LOOKUP_LIST } from '@/lib/constant';

import { useStore } from '../_store';
import { getList, getGroups } from '../_api';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import FilterBar from './filter-bar';
import Group from './group';
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { columns } from './table/columns';
import Table from './table/table';
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
  const table = useReactTable({
    data: data?.list?.sort((a, b) => a.sort - b.sort) || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  useEffect(() => {
    if (!currentGroup && groupData?.list) setCurrentGroup(groupData.list[0]);
  }, [groupData]);
  let GroupUI = null;
  if (groupData?.list) GroupUI = <Group data={groupData} />;

  return (
    <Card>
      <CardHeader>
        <FilterBar />
      </CardHeader>
      <CardContent>
        <div className="flex">
          <div className=" max-w-[220px] border-r pr-2">{GroupUI}</div>
          <div className="flex-1 w-full">
            <Table table={table} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
