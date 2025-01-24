'use client';

import React, { useCallback } from 'react';
import {
  flexRender,
  Table as RTable,
  useReactTable,
  getCoreRowModel,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ILookUP } from '../../../_type';
import { columns } from './columns';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DraggableTableRow } from './draggable-table-row';
import { useStore } from '../../_store';
import { toast } from 'sonner';
// import { updateSort } from '../../_api'; // 需要创建这个API函数

interface TableDataProps {
  data: ILookUP.asObject[];
}

export default function TableData({ data }: TableDataProps) {
  const [items, setItems] = React.useState(data);
  const { currentGroup } = useStore();

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => `${row.id}`, //required because row indexes will change
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
  });
  const dataIds = items.map((it) => it.id);
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!active || !over || active.id === over.id) {
        return;
      }
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      try {
        // 更新排序到服务器
        // await updateSort({
        //   groupId: currentGroup?.value || '',
        //   items: newItems.map((item, index) => ({
        //     id: item.id,
        //     sort: index + 1,
        //   })),
        // });
        toast.success('排序更新成功');
      } catch (error) {
        toast.error('排序更新失败');
        setItems(data); // 恢复原始顺序
      }
    },
    [items, currentGroup, data]
  );

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <Table className="overflow-auto w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]" /> {/* 拖动把手列 */}
            {table
              .getHeaderGroups()
              .map((headerGroup) =>
                headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))
              )}
          </TableRow>
        </TableHeader>
        <TableBody>
          <SortableContext
            items={dataIds}
            strategy={verticalListSortingStrategy}
          >
            {table.getRowModel().rows.map((row) => (
              <DraggableTableRow key={row.id} row={row} />
            ))}
          </SortableContext>
        </TableBody>
      </Table>
    </DndContext>
  );
}
