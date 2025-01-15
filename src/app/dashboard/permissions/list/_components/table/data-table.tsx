import { flexRender, Table as TableType } from '@tanstack/react-table';
import { IPermissions } from '../../../_types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// needed for table body level scope DnD setup
// import {
//   DndContext,
//   KeyboardSensor,
//   MouseSensor,
//   TouchSensor,
//   closestCenter,
//   type DragEndEvent,
//   type UniqueIdentifier,
//   useSensor,
//   useSensors,
// } from "@dnd-kit/core";
// import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
// import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

// // needed for row & cell level scope DnD setup
// import { useSortable } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";
interface DataTableProps {
  table: TableType<IPermissions.TreeNode>;
}

export default function OptimizedTable({ table }: DataTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/50">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  className="h-12 text-left align-middle font-medium text-muted-foreground"
                >
                  {header.isPlaceholder ? null : (
                    <div className="flex items-center space-x-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className="p-2 align-middle [&:has([role=checkbox])]:pr-0"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
