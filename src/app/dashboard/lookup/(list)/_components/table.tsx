import { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  Cell,
} from '@tanstack/react-table';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { listItem } from '../_type';

interface DraggableTableProps {
  data: listItem[];
  onReorder: (reorderedData: listItem[]) => void;
  onSwitchChange: (
    id: number,
    field: 'isActive' | 'isDefault',
    checked: boolean
  ) => void;
}

const SortableRow = ({
  row,
  onSwitchChange,
}: {
  row: any;
  onSwitchChange: DraggableTableProps['onSwitchChange'];
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.original.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    cursor: isDragging ? 'grabbing' : 'grab',
    boxShadow: isDragging ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none',
  };

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {row.getVisibleCells().map((cell) => {
        if (cell.column.id === 'isActive' || cell.column.id === 'isDefault') {
          return (
            <TableCell key={cell.id}>
              <Switch
                checked={cell.getValue() as boolean}
                onCheckedChange={(checked) =>
                  onSwitchChange(
                    row.original.id,
                    cell.column.id as 'isActive' | 'isDefault',
                    checked
                  )
                }
                disabled={
                  cell.column.id === 'isDefault' && row.original.isDefault
                }
              />
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
};

const columns: ColumnDef<listItem>[] = [
  {
    accessorKey: 'label',
    header: '名称',
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('label')}</span>
    ),
  },
  {
    accessorKey: 'value',
    header: '值',
  },
  {
    accessorKey: 'isActive',
    header: '状态',
  },
  {
    accessorKey: 'isDefault',
    header: '默认',
  },
  {
    accessorKey: 'remark',
    header: '备注',
  },
];

export default function DraggableTable({
  data: initialData,
  onReorder,
  onSwitchChange,
}: DraggableTableProps) {
  const [data, setData] = useState<listItem[]>(initialData);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id.toString(),
  });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 50, tolerance: 5 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = data.findIndex((item) => item.id === active.id);
    const newIndex = data.findIndex((item) => item.id === over.id);
    const newData = arrayMove(data, oldIndex, newIndex);

    setData(newData);
    onReorder(newData);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <Table className="border rounded-lg">
        <TableHeader className="bg-gray-100/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="font-semibold">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          <SortableContext items={data} strategy={verticalListSortingStrategy}>
            {table.getRowModel().rows.map((row) => (
              <SortableRow
                key={row.id}
                row={row}
                onSwitchChange={onSwitchChange}
              />
            ))}
          </SortableContext>
        </TableBody>
      </Table>
    </DndContext>
  );
}
