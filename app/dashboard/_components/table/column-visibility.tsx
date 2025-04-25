"use client";

import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ColumnVisibilityProps<TData> {
  table: Table<TData>;
  columnLabels?: Record<string, string>;
}

export function ColumnVisibility<TData>({ 
  table, 
  columnLabels 
}: ColumnVisibilityProps<TData>) {
  const allColumns = table.getAllColumns();
  const visibleColumns = allColumns.filter(column => column.getCanHide());
  
  return (
    <div className="mt-4 flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings2 className="mr-2 h-4 w-4" />
            显示列
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>切换显示列</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {visibleColumns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(checked) => column.toggleVisibility(!!checked)}
            >
              {columnLabels?.[column.id] || column.columnDef.header as string}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 