"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnOrderState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  OnChangeFn,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  DragMoveEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onSortChange?: (newData: TData[]) => void;
  onColumnOrderChange?: (newColumnOrder: string[]) => void;
  initialColumnOrder?: string[];
  loading?: boolean;
  columnLabels?: Record<string, string>;
  enableRowDrag?: boolean;
  enableColumnDrag?: boolean;
}

// 加载行组件
const LoadingRow = () => (
  <TableRow className="group">
    <TableCell className="w-[40px]">
      <Skeleton className="h-4 w-4" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[120px]" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[80px]" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[100px]" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[80px]" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[150px]" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[150px]" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-[150px]" />
    </TableCell>
  </TableRow>
);

// 加载表头组件
const LoadingHeader = () => (
  <TableHeader>
    <TableRow>
      <TableHead className="w-[40px]">
        <Skeleton className="h-4 w-4" />
      </TableHead>
      <TableHead>
        <Skeleton className="h-4 w-[120px]" />
      </TableHead>
      <TableHead>
        <Skeleton className="h-4 w-[80px]" />
      </TableHead>
      <TableHead>
        <Skeleton className="h-4 w-[100px]" />
      </TableHead>
      <TableHead>
        <Skeleton className="h-4 w-[80px]" />
      </TableHead>
      <TableHead>
        <Skeleton className="h-4 w-[150px]" />
      </TableHead>
      <TableHead>
        <Skeleton className="h-4 w-[150px]" />
      </TableHead>
      <TableHead>
        <Skeleton className="h-4 w-[150px]" />
      </TableHead>
    </TableRow>
  </TableHeader>
);

// 可拖拽行组件
const DraggableRow = ({ row }: { row: any }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: row.original.id,
  });

  const style = transform
    ? {
        transform: CSS.Transform.toString(transform),
      }
    : undefined;

  return (
    <TableRow
      ref={setNodeRef}
      data-state={row.getIsSelected() && "selected"}
      className="group cursor-move"
      style={style}
      {...attributes}
      {...listeners}
    >
      {row.getVisibleCells().map((cell: any) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
};

// 可拖拽表头组件
const DraggableHeader = ({ 
  header, 
  table, 
  columnLabels 
}: { 
  header: any; 
  table: any; 
  columnLabels: Record<string, string> 
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: header.id,
  });

  const style = transform
    ? {
        transform: CSS.Transform.toString(transform),
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      className="cursor-move"
      style={style}
      {...attributes}
      {...listeners}
    >
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}
    </div>
  );
};

export function DataTable<TData, TValue>({
  columns,
  data,
  onSortChange,
  onColumnOrderChange,
  initialColumnOrder,
  loading = false,
  columnLabels = {},
  enableRowDrag = false,
  enableColumnDrag = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(
    initialColumnOrder || []
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [localData, setLocalData] = React.useState<TData[]>(data);

  // 当外部数据变化时更新本地数据
  React.useEffect(() => {
    setLocalData(data);
  }, [data]);

  // 处理列顺序变化
  const handleColumnOrderChange: OnChangeFn<ColumnOrderState> = (updater) => {
    const newColumnOrder = typeof updater === 'function' ? updater(columnOrder) : updater;
    setColumnOrder(newColumnOrder);
    if (onColumnOrderChange) {
      onColumnOrderChange(newColumnOrder);
    }
  };

  // 设置拖拽传感器
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // 处理拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // 处理拖拽移动 - 实现乐观更新
  const handleDragMove = (event: DragMoveEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localData.findIndex((item: any) => (item as any).id === active.id);
      const newIndex = localData.findIndex((item: any) => (item as any).id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newData = [...localData];
        const [removed] = newData.splice(oldIndex, 1);
        newData.splice(newIndex, 0, removed);
        setLocalData(newData);
      }
    }
  };

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // 数据已经在拖拽过程中更新，这里只需要通知父组件
      if (onSortChange) {
        onSortChange(localData);
      }
    }
    setActiveId(null);
  };

  // 初始化表格
  const table = useReactTable({
    data: localData, // 使用本地数据而不是外部数据
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnOrderChange: handleColumnOrderChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnOrder,
      columnVisibility,
      rowSelection,
    },
  });

  // 渲染表格内容
  const renderTableContent = () => {
    if (loading) {
      return (
        <>
          <LoadingHeader />
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <LoadingRow key={index} />
            ))}
          </TableBody>
        </>
      );
    }

    if (data.length === 0) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              暂无数据
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    return (
      <>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {enableColumnDrag ? (
                      <DraggableHeader
                        header={header}
                        table={table}
                        columnLabels={columnLabels}
                      />
                    ) : (
                      header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              enableRowDrag ? (
                <DraggableRow key={row.id} row={row} />
              ) : (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              )
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                暂无数据
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </>
    );
  };

  // 自定义拖拽覆盖层组件
  const DragOverlayContent = () => {
    if (!activeId) return null;
    
    const activeRow = table
      .getRowModel()
      .rows.find((row) => (row.original as any).id === activeId);
    
    if (!activeRow) return null;
    
    return (
      <div className="bg-muted/50 rounded-md shadow-md">
        <table className="w-full">
          <tbody>
            <tr className="border-b">
              {activeRow.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-2">
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="rounded-md border">
      <DndContext
        sensors={sensors}
        modifiers={[restrictToVerticalAxis]}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <Table>
          {renderTableContent()}
        </Table>
        <DragOverlay>
          <DragOverlayContent />
        </DragOverlay>
      </DndContext>
    </div>
  );
}
