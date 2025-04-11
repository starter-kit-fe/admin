import { useState } from "react";
import { Row } from "@tanstack/react-table";
import { TableCell, TableRow } from "@/components/ui/table";
import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type lookup } from "../api";
import { flexRender } from "@tanstack/react-table";

interface DraggableRowProps {
  row: Row<lookup>;
}

export function DraggableRow({ row }: DraggableRowProps) {
  const [isHovering, setIsHovering] = useState(false);
  const item = row.original;
  const id = item.id?.toString() || `item-${row.index}`;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.2, 0, 0.2, 1)'
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    backgroundColor: isDragging ? 'var(--background-muted)' : undefined,
    zIndex: isDragging ? 9999 : 1,
    scale: isDragging ? '1.02' : '1',
    transformOrigin: 'center center',
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={row.getIsSelected() && "selected"}
      className={`group transition-colors ${isDragging ? 'shadow-md rounded' : ''}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {row.getVisibleCells().map(cell => {
        if (cell.column.id === 'drag-handle') {
          return (
            <TableCell key={cell.id}>
              <div className="px-1 flex justify-center">
                <button
                  className={`touch-none transition-opacity ${isHovering || isDragging ? 'opacity-100' : 'opacity-0'}`}
                  {...attributes}
                  {...listeners}
                  aria-label="拖拽排序"
                >
                  <GripVertical
                    className={`h-4 w-4 text-muted-foreground ${isDragging ? 'text-primary' : 'cursor-grab'}`}
                  />
                </button>
              </div>
            </TableCell>
          );
        }

        return (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        );
      })}
    </TableRow>
  );
} 