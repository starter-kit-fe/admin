'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Table from './table/table';
import { ILookUP } from '../../_type';
import { columns } from './table/columns';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
// import Pagination from '@/components/pagination';
import { ListFilter } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
interface LookupListprops {
  data: ILookUP.listResponse | undefined;
}
export default function Page({ data }: LookupListprops) {
  const table = useReactTable({
    data: data?.list ? data?.list.sort((a, b) => a.sort - b.sort) : [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const search = useSearchParams();
  const currentGroupValue = search.get('currentGroupValue') || '';
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {currentGroupValue.toUpperCase()}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto hidden h-8 lg:flex"
              >
                <ListFilter className="mr-2 h-4 w-4" /> 显示列
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              <DropdownMenuLabel>切换行</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== 'undefined' &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table table={table} />

        {/* <Pagination
          page={params.page}
          size={params.size}
          total={data?.total || 0}
          onChangePage={(page) => setParams({ page })}
          onChangeSize={(size) => setParams({ size })}
        /> */}
      </CardContent>
    </Card>
  );
}
