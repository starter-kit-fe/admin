import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ListFilter } from 'lucide-react';
import Link from 'next/link';
import { Table } from '@tanstack/react-table';
import { IPermissions } from '../../_types';
interface TableToolbarProps {
  table: Table<IPermissions.TreeNode>; // Replace with proper table type
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export const TableToolbar = ({
  table,
  searchQuery,
  onSearchChange,
}: TableToolbarProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="搜索权限..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 w-[250px]"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => table.toggleAllRowsExpanded()}
        >
          <ChevronDown className=" h-4 w-4" />
          {table.getIsAllRowsExpanded() ? '收起' : '展开'}全部
        </Button>
      </div>
      <Link href="/dashboard/permissions/create">
        <Button variant="outline" size="sm" className="ml-auto mr-1">
          新增
        </Button>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="ml-auto">
            <ListFilter className="mr-2 h-4 w-4" />
            显示列
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
