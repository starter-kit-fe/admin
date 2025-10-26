import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  type DragEndEvent,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import type { MenuTreeNode } from '../type';

const TYPE_META: Record<string, { label: string; variant: 'default' | 'outline' | 'secondary' }> = {
  M: { label: '目录', variant: 'secondary' },
  C: { label: '菜单', variant: 'default' },
  F: { label: '按钮', variant: 'outline' },
};

const STATUS_META: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  '0': { label: '正常', variant: 'secondary' },
  '1': { label: '停用', variant: 'destructive' },
};

const VISIBLE_META: Record<string, string> = {
  '0': '显示',
  '1': '隐藏',
};

type SortableNode = {
  node: MenuTreeNode;
  depth: number;
  parentId: number;
  index: number;
};

function flattenTree(nodes: MenuTreeNode[], expanded: Set<number>, depth = 0, parentId = 0): SortableNode[] {
  const result: SortableNode[] = [];
  nodes.forEach((node, index) => {
    result.push({ node, depth, parentId, index });
    const hasChildren = node.children && node.children.length > 0;
    if (hasChildren && expanded.has(node.menuId)) {
      result.push(...flattenTree(node.children!, expanded, depth + 1, node.menuId));
    }
  });
  return result;
}

interface MenuTreeViewProps {
  nodes: MenuTreeNode[];
  loading?: boolean;
  onAddChild: (node: MenuTreeNode) => void;
  onEdit: (node: MenuTreeNode) => void;
  onDelete: (node: MenuTreeNode) => void;
  onReorder: (parentId: number, orderedIds: number[]) => void;
}

function useSiblingNodes(nodes: MenuTreeNode[]) {
  return useCallback(
    (parentId: number): MenuTreeNode[] | null => {
      if (parentId === 0) {
        return nodes;
      }
      const stack = [...nodes];
      while (stack.length) {
        const current = stack.shift()!;
        if (current.menuId === parentId) {
          return current.children ?? [];
        }
        if (current.children) {
          stack.push(...current.children);
        }
      }
      return null;
    },
    [nodes],
  );
}

function MenuRow({
  item,
  expanded,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
}: {
  item: SortableNode;
  expanded: Set<number>;
  onToggle: (id: number) => void;
  onAddChild: (node: MenuTreeNode) => void;
  onEdit: (node: MenuTreeNode) => void;
  onDelete: (node: MenuTreeNode) => void;
}) {
  const { node, depth } = item;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.menuId,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasChildren = Boolean(node.children?.length);
  const isExpanded = expanded.has(node.menuId);
  const typeMeta = TYPE_META[node.menuType] ?? { label: node.menuType, variant: 'default' };
  const statusMeta = STATUS_META[node.status] ?? { label: node.status, variant: 'default' };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex flex-col gap-1 rounded-lg border border-transparent px-2 py-1.5 transition-colors',
        isDragging && 'border-border bg-muted/50',
      )}
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 cursor-grab text-muted-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
          <span className="sr-only">拖动排序</span>
        </Button>
        <div
          className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5"
          style={{ marginLeft: depth * 16 }}
        >
          {hasChildren ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7 text-muted-foreground"
              onClick={() => onToggle(node.menuId)}
            >
              {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </Button>
          ) : (
            <span className="ml-3 block size-7" />
          )}

          <div className="flex flex-col">
            <span className="font-medium text-foreground">{node.menuName}</span>
            <span className="text-xs text-muted-foreground">
              {node.path || '—'} · {node.routeName || '未配置'}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Badge variant={typeMeta.variant}>{typeMeta.label}</Badge>
            <Badge variant="outline">{VISIBLE_META[node.visible] ?? node.visible}</Badge>
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
          </div>

          <div className="flex items-center gap-1">
            {node.menuType !== 'F' ? (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="size-7"
                onClick={() => onAddChild(node)}
              >
                <Plus className="size-4" />
                <span className="sr-only">新增子菜单</span>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="size-7"
              onClick={() => onEdit(node)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">编辑</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {node.menuType !== 'F' ? (
                  <DropdownMenuItem onSelect={() => onAddChild(node)}>
                    <Plus className="mr-2 size-4" />
                    新增子级
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onSelect={() => onEdit(node)}>
                  <Pencil className="mr-2 size-4" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onDelete(node)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {node.remark ? (
        <div className="ml-14 text-xs text-muted-foreground">{node.remark}</div>
      ) : null}
    </div>
  );
}

export function MenuTreeView({
  nodes,
  loading,
  onAddChild,
  onEdit,
  onDelete,
  onReorder,
}: MenuTreeViewProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const flatNodes = useMemo(() => flattenTree(nodes, expanded), [nodes, expanded]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const siblingNodes = useSiblingNodes(nodes);

  useEffect(() => {
    const next = new Set<number>();
    const collect = (items: MenuTreeNode[]) => {
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          next.add(item.menuId);
          collect(item.children);
        }
      });
    };
    collect(nodes);
    setExpanded(next);
  }, [nodes]);

  const handleToggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      const activeNode = flatNodes.find((item) => item.node.menuId === active.id);
      const overNode = flatNodes.find((item) => item.node.menuId === over.id);
      if (!activeNode || !overNode) {
        return;
      }
      if (activeNode.parentId != overNode.parentId) {
        return;
      }
      const siblings = siblingNodes(activeNode.parentId);
      if (!siblings) {
        return;
      }
      const orderedIds = arrayMove(
        siblings.map((item) => item.menuId),
        activeNode.index,
        overNode.index,
      );
      onReorder(activeNode.parentId, orderedIds);
    },
    [flatNodes, onReorder, siblingNodes],
  );

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        菜单加载中...
      </div>
    );
  }

  if (flatNodes.length === 0) {
    return <div className="py-10 text-center text-sm text-muted-foreground">暂无菜单数据</div>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={flatNodes.map((item) => item.node.menuId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-1">
          {flatNodes.map((item) => (
            <MenuRow
              key={item.node.menuId}
              item={item}
              expanded={expanded}
              onToggle={handleToggle}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
