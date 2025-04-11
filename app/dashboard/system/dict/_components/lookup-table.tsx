"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, MoreVertical, Trash2, GripVertical } from "lucide-react";
import { formatDateTime } from "@/lib/format-date";
import { type lookup } from "../api";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  Row,
  createColumnHelper
} from "@tanstack/react-table";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DraggableRow } from "./draggable-row";
import { LoadingRow } from "./loading-row";
// import { StatusBadge } from "./status-badge";
// import { DefaultBadge } from "./default-badge";

// 状态徽章组件
function StatusBadge({ status }: { status: number | undefined }) {
  if (status === undefined) return null;

  return status === 1 ? (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
      正常
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
      停用
    </Badge>
  );
}

// 默认值徽章组件
function DefaultBadge({ isDefault }: { isDefault: boolean | undefined }) {
  if (!isDefault) return null;

  return (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
      默认
    </Badge>
  );
}

// 优化拖拽行组件 - 添加更好的视觉反馈
function DraggableTableRow({
  row,
}: {
  row: Row<lookup>;
}) {
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
        // 特殊处理拖拽手柄列
        if (cell.column.id === 'drag-handle') {
          return (
            <TableCell key={cell.id}>
              <div className="px-1 flex justify-center">
                <button
                  className={`touch-none transition-opacity ${isHovering || isDragging ? 'opacity-100' : 'opacity-0'
                    }`}
                  {...attributes}
                  {...listeners}
                  aria-label="拖拽排序"
                >
                  <GripVertical
                    className={`h-4 w-4 text-muted-foreground ${isDragging ? 'text-primary' : 'cursor-grab'
                      }`}
                  />
                </button>
              </div>
            </TableCell>
          );
        }

        // 其他普通列
        return (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

// 主表格组件
interface LookupTableProps {
  data: lookup[];
  columns: Record<string, boolean>;
  isLoading: boolean;
  onReorder: (items: { from: string, to: string, list: lookup[] }) => void;
}

export function LookupTable({
  data,
  columns: visibleColumns,
  isLoading,
  onReorder,
}: LookupTableProps) {
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});
  const [localData, setLocalData] = useState<lookup[]>(data);
  
  // 当外部数据变化时更新本地数据
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // 拖拽排序相关设置
  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { 
        distance: 5
      } 
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localData.findIndex(item => (item.id?.toString() || '') === active.id);
      const newIndex = localData.findIndex(item => (item.id?.toString() || '') === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // 乐观更新：立即更新UI
        const newItems = arrayMove([...localData], oldIndex, newIndex);
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          sort: index + 1
        }));
        
        setLocalData(updatedItems);
        
        // 异步通知父组件
        setTimeout(() => {
          onReorder({
            from: active.id.toString(),
            to: over.id.toString(),
            list: updatedItems,
          });
        }, 0);
      }
    }
  }

  // 修改为正确使用 createColumnHelper 的代码
  const columnHelper = createColumnHelper<lookup>();

  // 定义表格列 - 移除 useMemo（React 19 不再需要）
  const tableColumns = [
    // 添加拖拽控件列作为第一列
    columnHelper.display({
      id: 'drag-handle',
      header: '',
      cell: () => null,
      size: 40,
    }),

    // 根据可见列配置添加其他列
    ...(visibleColumns.id ? [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: info => (
          <span className="font-mono text-xs text-muted-foreground">{info.getValue()}</span>
        ),
        size: 60,
      })
    ] : []),

    ...(visibleColumns.label ? [
      columnHelper.accessor('label', {
        header: '标签名',
        cell: info => info.getValue(),
      })
    ] : []),

    ...(visibleColumns.value ? [
      columnHelper.accessor('value', {
        header: '字典值',
        cell: info => (
          <span className="font-mono">{info.getValue()}</span>
        ),
      })
    ] : []),

    ...(visibleColumns.sort ? [
      columnHelper.accessor('sort', {
        header: '排序',
        cell: info => (
          <div className="text-center">{info.getValue()}</div>
        ),
      })
    ] : []),

    ...(visibleColumns.status ? [
      columnHelper.accessor('status', {
        header: '状态',
        cell: info => {
          const item = info.row.original;
          return (
            <Switch
              checked={item.status === 1}
              onCheckedChange={() => handleToggleStatus(item)}
              aria-label="Toggle status"
            />
          );
        },
      })
    ] : []),

    ...(visibleColumns.isDefault ? [
      columnHelper.accessor('isDefault', {
        header: '默认',
        cell: info => <DefaultBadge isDefault={info.getValue()} />,
      })
    ] : []),

    ...(visibleColumns.remark ? [
      columnHelper.accessor('remark', {
        header: '备注',
        cell: info => (
          <div className="max-w-[200px] truncate">{info.getValue()}</div>
        ),
      })
    ] : []),

    ...(visibleColumns.createdAt ? [
      columnHelper.accessor('createdAt', {
        header: '创建时间',
        cell: info => {
          const value = info.getValue();
          return (
            <span className="text-xs text-muted-foreground">
              {value ? formatDateTime(value) : '-'}
            </span>
          );
        },
      })
    ] : []),

    ...(visibleColumns.updatedAt ? [
      columnHelper.accessor('updatedAt', {
        header: '更新时间',
        cell: info => {
          const value = info.getValue();
          return (
            <span className="text-xs text-muted-foreground">
              {value ? formatDateTime(value) : '-'}
            </span>
          );
        },
      })
    ] : []),

    ...(visibleColumns.actions ? [
      columnHelper.display({
        id: 'actions',
        header: '操作',
        cell: info => {
          const item = info.row.original;
          return (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className=""
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    删除
                  </DropdownMenuItem>

                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 100,
      })
    ] : []),
  ];
  // 初始化表格实例
  const table = useReactTable({
    data: localData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      rowSelection: selectedRowIds,
    },
    onRowSelectionChange: setSelectedRowIds,
  });

  // 处理编辑
  const handleEdit = (item: lookup) => {
    console.log('编辑字典项:', item);
    // 这里应该打开编辑模态框
  };

  // 处理删除
  const handleDelete = (item: lookup) => {
    console.log('删除字典项:', item);
    // 这里应该显示确认删除对话框
  };

  // 处理状态切换
  const handleToggleStatus = (item: lookup) => {
    console.log('切换状态:', item);
    // 这里应该调用API更新状态
  };

  // 计算可见列数（增加了拖拽控件列，所以+1）
  const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length + 1;

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      }
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // 加载状态
                Array.from({ length: 5 }).map((_, index) => (
                  <LoadingRow key={index} columns={visibleColumns} />
                ))
              ) : data.length === 0 ? (
                // 空状态
                <TableRow>
                  <TableCell colSpan={visibleColumnCount} className="h-32 text-center">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                // 正常数据展示 - 将 SortableContext 包裹在表格行外部
                <SortableContext
                  items={localData.map(item => item.id?.toString() || Math.random().toString())}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map(row => (
                    <DraggableRow
                      key={row.id}
                      row={row}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>
    </div>
  );
}