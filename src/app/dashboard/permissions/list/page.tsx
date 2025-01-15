'use client';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
} from '@tanstack/react-table';
import { usePermissionTable } from '../_hook';
import { StatusTabs } from './_components/status-tabs';
import { TableToolbar } from './_components/tool-bar';
import { columns } from './_components/table/columns';
import DataTable from './_components/table/data-table';
import Show from '@/components/show';
import Loading from '../../loading';
import Empty from '@/components/empty';

export default function Page() {
  const {
    list,
    isLoading,
    isError,
    error,
    status,
    setStatus,
    searchQuery,
    setSearchQuery,
    expanded,
    setExpanded,
    sorting,
    columnVisibility,
    setColumnVisibility,
  } = usePermissionTable();

  const table = useReactTable({
    data: list,
    columns,
    state: {
      expanded,
      sorting,
      columnVisibility,
    },
    enableExpanding: true, // Add this line
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: setColumnVisibility,
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  if (isError) throw error;

  return (
    <div className="space-y-4">
      <title>权限列表</title>
      <StatusTabs value={status} onChange={setStatus} />

      <TableToolbar
        table={table}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <Show when={!isLoading} fallback={<Loading />}>
        <Show when={list.length > 0} fallback={<Empty />}>
          <DataTable table={table} />
        </Show>
      </Show>
    </div>
  );
}
