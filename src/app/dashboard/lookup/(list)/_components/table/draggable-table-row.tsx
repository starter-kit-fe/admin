import { useSortable } from '@dnd-kit/sortable';
import React, { CSSProperties } from 'react';
import { TableRow } from '@/components/ui/table';
import { GripVertical } from 'lucide-react';
import { CSS } from '@dnd-kit/utilities';
import {
  ColumnDef,
  Row,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { ILookUP } from '@/app/dashboard/lookup/_type';

interface Props {
  row: Row<ILookUP.asObject>;
}

export function DraggableTableRow({ row }: Props) {
  const {
    attributes,
    listeners,
    transform,
    transition,
    setNodeRef,
    isDragging,
  } = useSortable({ id: row.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform), //let dnd-kit do its thing
    transition: transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative',
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} style={{ width: cell.column.getSize() }}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </TableRow>
  );
}
