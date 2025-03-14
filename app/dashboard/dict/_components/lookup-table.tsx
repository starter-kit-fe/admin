"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
import { type lookup } from "../api";
import { Edit, MoreVertical, Trash2, GripVertical } from "lucide-react";
import { formatDateTime } from "@/lib/format-date";
import { Skeleton } from "@/components/ui/skeleton";

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

// 单个行项目组件（支持拖拽排序）
function SortableRow({
  item,
  columns,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  item: lookup;
  columns: Record<string, boolean>;
  onEdit: (item: lookup) => void;
  onDelete: (item: lookup) => void;
  onToggleStatus: (item: lookup) => void;
}) {
  const id = item.id?.toString() || Math.random().toString();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      {columns.id && (
        <TableCell className="font-mono text-xs text-muted-foreground w-14">
          {item.id}
        </TableCell>
      )}
      
      {columns.label && (
        <TableCell>
          <div className="flex items-center gap-2">
            <button className="touch-none" {...attributes} {...listeners}>
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            </button>
            <span>{item.label}</span>
          </div>
        </TableCell>
      )}
      
      {columns.value && (
        <TableCell className="font-mono">{item.value}</TableCell>
      )}
      
      {columns.sort && (
        <TableCell className="text-center">{item.sort}</TableCell>
      )}
      
      {columns.status && (
        <TableCell>
          <Switch 
            checked={item.status === 1} 
            onCheckedChange={() => onToggleStatus(item)}
            aria-label="Toggle status"
          />
        </TableCell>
      )}
      
      {columns.isDefault && (
        <TableCell>
          <DefaultBadge isDefault={item.isDefault} />
        </TableCell>
      )}
      
      {columns.remark && (
        <TableCell className="max-w-[200px] truncate">
          {item.remark}
        </TableCell>
      )}
      
      {columns.createdAt && (
        <TableCell className="text-xs text-muted-foreground">
          {item.createdAt ? formatDateTime(item.createdAt) : '-'}
        </TableCell>
      )}
      
      {columns.updatedAt && (
        <TableCell className="text-xs text-muted-foreground">
          {item.updatedAt ? formatDateTime(item.updatedAt) : '-'}
        </TableCell>
      )}
      
      {columns.actions && (
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(item)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(item)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}

// 加载状态行
function LoadingRow({ columns }: { columns: Record<string, boolean> }) {
  return (
    <TableRow>
      {columns.id && (
        <TableCell><Skeleton className="h-4 w-10" /></TableCell>
      )}
      {columns.label && (
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      )}
      {columns.value && (
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      )}
      {columns.sort && (
        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
      )}
      {columns.status && (
        <TableCell><Skeleton className="h-5 w-10 rounded-full" /></TableCell>
      )}
      {columns.isDefault && (
        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
      )}
      {columns.remark && (
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      )}
      {columns.createdAt && (
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      )}
      {columns.updatedAt && (
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      )}
      {columns.actions && (
        <TableCell><Skeleton className="h-8 w-16" /></TableCell>
      )}
    </TableRow>
  );
}

// 主表格组件
interface LookupTableProps {
  data: lookup[];
  columns: Record<string, boolean>;
  isLoading: boolean;
  onReorder: (items: lookup[]) => void;
}

export function LookupTable({
  data,
  columns,
  isLoading,
  onReorder,
}: LookupTableProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // 拖拽排序相关设置
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 处理拖拽结束事件
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = data.findIndex(item => (item.id?.toString() || '') === active.id);
      const newIndex = data.findIndex(item => (item.id?.toString() || '') === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(data, oldIndex, newIndex);
        onReorder(newItems);
      }
    }
  }

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

  // 处理全选/取消全选
  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedItems(data.map(item => item.id?.toString() || '').filter(Boolean));
    } else {
      setSelectedItems([]);
    }
  };

  // 处理单个选择
  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    }
  };

  // 计算全选状态
  const allSelected = data.length > 0 && selectedItems.length === data.length;
  const someSelected = selectedItems.length > 0 && !allSelected;

  // 生成表格列表头
  const visibleColumnCount = Object.values(columns).filter(Boolean).length;

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.id && (
                <TableHead className="w-14">ID</TableHead>
              )}
              {columns.label && (
                <TableHead>标签名</TableHead>
              )}
              {columns.value && (
                <TableHead>字典值</TableHead>
              )}
              {columns.sort && (
                <TableHead className="text-center">排序</TableHead>
              )}
              {columns.status && (
                <TableHead>状态</TableHead>
              )}
              {columns.isDefault && (
                <TableHead>默认</TableHead>
              )}
              {columns.remark && (
                <TableHead>备注</TableHead>
              )}
              {columns.createdAt && (
                <TableHead>创建时间</TableHead>
              )}
              {columns.updatedAt && (
                <TableHead>更新时间</TableHead>
              )}
              {columns.actions && (
                <TableHead className="w-[100px]">操作</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // 加载状态
              Array.from({ length: 5 }).map((_, index) => (
                <LoadingRow key={index} columns={columns} />
              ))
            ) : data.length === 0 ? (
              // 空状态
              <TableRow>
                <TableCell colSpan={visibleColumnCount} className="h-32 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              // 正常数据展示
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={data.map(item => item.id?.toString() || Math.random().toString())}
                  strategy={verticalListSortingStrategy}
                >
                  {data.map((item) => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      columns={columns}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
