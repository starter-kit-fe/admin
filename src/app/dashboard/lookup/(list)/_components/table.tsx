import { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
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
import { GripVertical } from 'lucide-react'; // 添加拖拽图标
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
  const [isHovered, setIsHovered] = useState(false);
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({
    id: row.original.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    backgroundColor: isDragging ? 'rgb(243 244 246)' : undefined,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      {/* 排序图标列 */}
      <TableCell className="w-10 relative">
        <div
          {...attributes}
          {...listeners}
          className={`absolute inset-y-0 left-0 flex items-center justify-center w-10 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </TableCell>

      {row.getVisibleCells().map((cell: any) => {
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
    id: 'sort',
    size: 40,
    header: () => null,
    cell: () => null,
  },
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
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
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
      <Table className="rounded-lg w-full overflow-hidden box-border border">
        <TableHeader className="bg-gray-100/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="font-semibold"
                  style={{ width: header.column.getSize() }}
                >
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
