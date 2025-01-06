'use client';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import columns from './columns';
import { IApp } from '@/app/(mian)/_type';
import DataTable from './data-table';
interface DataTableProps {
  data: IApp.asObject[];
}
export default function Page({ data }: DataTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return <DataTable table={table} />;
}
