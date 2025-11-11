'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  type CSSProperties,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { DepartmentNode, DepartmentStatus } from '../../type';

const STATUS_META: Partial<Record<DepartmentStatus, { label: string; className: string }>> = {
  '1': {
    label: '停用',
    className:
      'border border-rose-400/40 bg-rose-500/10 text-rose-600 dark:border-rose-400/50 dark:bg-rose-500/20 dark:text-rose-100',
  },
};

interface DepartmentTreeViewProps {
  nodes: DepartmentNode[];
  onAddChild: (node: DepartmentNode) => void;
  onEdit: (node: DepartmentNode) => void;
  onDelete: (node: DepartmentNode) => void;
}


function TreeLines({
  depth,
  ancestors,
  isLast,
}: {
  depth: number;
  ancestors: boolean[];
  isLast: boolean;
}) {
  if (depth === 0 && ancestors.length === 0) {
    return <span className="w-0" />;
  }

  const verticalLineStyle: CSSProperties = isLast
    ? { top: 0, height: '50%' }
    : { top: 0, bottom: 0 };

  return (
    <div className="mr-2 flex items-stretch">
      {ancestors.map((hasSibling, index) => (
        <span key={index} className="relative w-6">
          {hasSibling ? (
            <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 border-l border-dashed border-border/60 dark:border-border/40" />
          ) : null}
        </span>
      ))}
      {depth > 0 ? (
        <span className="relative w-6">
          <span
            className="absolute left-1/2 -translate-x-1/2 w-px border-l border-dashed border-border/60 dark:border-border/40"
            style={verticalLineStyle}
          />
          <span className="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 border-b border-dashed border-border/60 dark:border-border/40" />
        </span>
      ) : null}
    </div>
  );
}

export function DepartmentTreeView({
  nodes,
  onAddChild,
  onEdit,
  onDelete,
}: DepartmentTreeViewProps) {
  const parentIds = useMemo(() => {
    const ids: number[] = [];
    const walk = (items: DepartmentNode[]) => {
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          ids.push(item.deptId);
          walk(item.children);
        }
      });
    };
    walk(nodes);
    return ids;
  }, [nodes]);

  const parentKey = useMemo(() => parentIds.join(','), [parentIds]);
  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set(parentIds),
  );

  useEffect(() => {
    setExpanded((previous) => {
      const next = new Set(previous);
      let changed = false;
      parentIds.forEach((id) => {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      });
      return changed ? next : previous;
    });
  }, [parentKey, parentIds]);

  const toggleNode = useCallback((deptId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) {
        next.delete(deptId);
      } else {
        next.add(deptId);
      }
      return next;
    });
  }, []);

  const renderNodes = useCallback(
    (
      items: DepartmentNode[],
      depth = 1,
      ancestors: boolean[] = [],
    ): ReactElement[] => {
      return items.map((item, index) => {
        const hasChildren = Boolean(item.children?.length);
        const isExpanded = hasChildren ? expanded.has(item.deptId) : false;
        const statusMeta = STATUS_META[item.status];
        const isLast = index === items.length - 1;

        return (
          <div key={item.deptId} className="space-y-1">
            <div className="flex items-start gap-2 rounded-md px-2 py-2 transition-colors hover:bg-muted/40 dark:hover:bg-muted/20">
              <TreeLines depth={depth} ancestors={ancestors} isLast={isLast} />
              {hasChildren ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground"
                  onClick={() => toggleNode(item.deptId)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <span className="h-6 w-6 shrink-0" />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {item.deptName}
                  </span>
                  {statusMeta ? (
                    <Badge
                      className={cn(
                        'px-2 py-0.5 text-[11px] font-medium',
                        statusMeta.className,
                      )}
                    >
                      {statusMeta.label}
                    </Badge>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {item.leader ? <span>负责人：{item.leader}</span> : null}
                  {item.phone ? <span>电话：{item.phone}</span> : null}
                  {item.email ? <span>邮箱：{item.email}</span> : null}
                </div>
                {item.remark ? (
                  <div className="text-xs text-muted-foreground/80">
                    备注：{item.remark}
                  </div>
                ) : null}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => onAddChild(item)}>
                    <Plus className="mr-2 h-4 w-4" />
                    新增子部门
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onClick={() => onDelete(item)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {hasChildren && isExpanded ? (
              <div className="space-y-1">
                {renderNodes(item.children!, depth + 1, [...ancestors, !isLast])}
              </div>
            ) : null}
          </div>
        );
      });
    },
    [expanded, onAddChild, onDelete, onEdit, toggleNode],
  );

  if (nodes.length === 0) {
    return (
      <Empty className="h-60 border border-dashed border-border/60">
        <EmptyHeader>
          <EmptyTitle>暂无部门数据</EmptyTitle>
          <EmptyDescription>创建组织结构后即可在此维护上下级关系。</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return <div className="space-y-1">{renderNodes(nodes)}</div>;
}
