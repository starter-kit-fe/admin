import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  ArrowDown,
  ArrowUp,
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

import type { MenuTreeNode } from '../type';

const TYPE_META: Record<
  string,
  { label: string; variant: 'default' | 'outline' | 'secondary' }
> = {
  M: { label: '目录', variant: 'secondary' },
  C: { label: '菜单', variant: 'default' },
  F: { label: '按钮', variant: 'outline' },
};

const TYPE_BADGE_CLASSES: Record<string, string> = {
  M: 'border border-slate-200 bg-slate-100 text-slate-700',
  C: 'border border-sky-200 bg-sky-50 text-sky-700',
  F: 'border border-amber-200 bg-amber-50 text-amber-700',
};

const STATUS_META: Record<string, { label: string }> = {
  '0': { label: '正常' },
  '1': { label: '停用' },
};

const VISIBLE_META: Record<string, string> = {
  '0': '显示',
  '1': '隐藏',
};

interface MenuTreeViewProps {
  nodes: MenuTreeNode[];
  loading?: boolean;
  onAddChild: (node: MenuTreeNode) => void;
  onEdit: (node: MenuTreeNode) => void;
  onDelete: (node: MenuTreeNode) => void;
  onReorder: (parentId: number, orderedIds: number[]) => void;
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
            <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border/40" />
          ) : null}
        </span>
      ))}
      {depth > 0 ? (
        <span className="relative w-6">
          <span
            className="absolute left-1/2 -translate-x-1/2 w-px bg-border/60"
            style={verticalLineStyle}
          />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 h-px w-3 bg-border/60" />
        </span>
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
  const parentIds = useMemo(() => {
    const ids: number[] = [];
    const walk = (items: MenuTreeNode[]) => {
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          ids.push(item.menuId);
          walk(item.children);
        }
      });
    };
    walk(nodes);
    return ids;
  }, [nodes]);
  const parentKey = useMemo(() => parentIds.join(','), [parentIds]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      let changed = false;
      parentIds.forEach((id) => {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [parentKey, parentIds]);

  const toggleNode = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleMove = useCallback(
    (
      parentId: number,
      siblings: MenuTreeNode[],
      index: number,
      direction: 'up' | 'down',
    ) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= siblings.length) {
        return;
      }
      const orderedIds = siblings.map((item) => item.menuId);
      const [moved] = orderedIds.splice(index, 1);
      orderedIds.splice(targetIndex, 0, moved);
      onReorder(parentId, orderedIds);
    },
    [onReorder],
  );

  const renderNodes = useCallback(
    (
      items: MenuTreeNode[],
      depth = 0,
      parentId = 0,
      ancestors: boolean[] = [],
      parentPathSegments: string[] = [],
    ): ReactElement[] => {
      return items.map((node, index) => {
        const hasChildren = Boolean(node.children?.length);
        const isExpanded = hasChildren ? expanded.has(node.menuId) : false;
        const typeMeta = TYPE_META[node.menuType] ?? {
          label: node.menuType,
          variant: 'default',
        };
        const badgeTone =
          TYPE_BADGE_CLASSES[node.menuType] ??
          'border border-muted bg-muted text-foreground/80';
        const statusMeta = STATUS_META[node.status] ?? {
          label: node.status,
        };
        const isButton = node.menuType === 'F';
        const canMoveUp = index > 0;
        const canMoveDown = index < items.length - 1;
        const isRoot = parentId === 0;
        const hasPerms = Boolean(node.perms && node.perms.trim().length > 0);
        const isLast = index === items.length - 1;
        const rawSegment = (node.path ?? '').trim();
        const isExternalLink = /^https?:\/\//i.test(rawSegment);
        const normalizedSegment = isExternalLink
          ? rawSegment
          : rawSegment.replace(/^\/+|\/+$/g, '');
        const hasSegment =
          normalizedSegment !== '' && normalizedSegment !== '#';
        const routeSegments =
          !isButton && hasSegment && !isExternalLink
            ? [...parentPathSegments, normalizedSegment]
            : parentPathSegments;
        const displayRoute =
          !isButton && hasSegment
            ? isExternalLink
              ? normalizedSegment
              : routeSegments.length > 0
                ? `/${routeSegments.join('/')}`
                : null
            : null;
        const nextPathSegments =
          !isButton && hasSegment && !isExternalLink
            ? routeSegments
            : parentPathSegments;

        return (
          <div key={node.menuId} className="text-sm">
            <div className="flex items-stretch">
              <TreeLines depth={depth} ancestors={ancestors} isLast={isLast} />
              <div className="flex flex-1 flex-col gap-1 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40">
                <div className="flex flex-wrap items-center gap-2">
                  {hasChildren ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground"
                      onClick={() => toggleNode(node.menuId)}
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
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-foreground">
                        {node.menuName}
                      </span>
                      <Badge
                        className={cn(
                          'border px-2 py-0.5 text-[11px] font-medium',
                          badgeTone,
                        )}
                      >
                        {typeMeta.label}
                      </Badge>
                      {node.visible !== '0' ? (
                        <Badge className="border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                          {VISIBLE_META[node.visible] ?? node.visible}
                        </Badge>
                      ) : null}
                      {node.status !== '0' ? (
                        <Badge
                          variant="destructive"
                          className="px-2 py-0.5 text-[11px]"
                        >
                          {statusMeta.label}
                        </Badge>
                      ) : null}
                    </div>
                    <div className=" flex flex-wrap items-center gap-x-6 gap-y-1">
                      {!isButton ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="text-[11px] text-muted-foreground/70">
                            路由
                          </span>
                          {displayRoute ? (
                            <code className="rounded bg-muted px-1.5 py-[1px] font-mono text-[11px] text-foreground">
                              {displayRoute}
                            </code>
                          ) : (
                            <span className="text-muted-foreground/45">
                              未配置
                            </span>
                          )}
                        </span>
                      ) : null}
                      {!isButton && node.routeName ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="text-[11px] text-muted-foreground/70">
                            标识
                          </span>
                          <code className="rounded bg-muted px-1.5 py-[1px] font-mono text-[11px] text-foreground">
                            {node.routeName}
                          </code>
                        </span>
                      ) : null}
                      {!isRoot ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="text-[11px] text-muted-foreground/70">
                            权限
                          </span>
                          {hasPerms ? (
                            <code className="rounded bg-muted px-1.5 py-[1px] font-mono text-[11px] text-foreground">
                              {node.perms}
                            </code>
                          ) : (
                            <span className="text-muted-foreground/45">
                              未配置
                            </span>
                          )}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      disabled={!canMoveUp}
                      onClick={() => handleMove(parentId, items, index, 'up')}
                    >
                      <ArrowUp className="h-4 w-4" />
                      <span className="sr-only">上移</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      disabled={!canMoveDown}
                      onClick={() => handleMove(parentId, items, index, 'down')}
                    >
                      <ArrowDown className="h-4 w-4" />
                      <span className="sr-only">下移</span>
                    </Button>
                    {!isButton ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onAddChild(node)}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">新增子菜单</span>
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit(node)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">编辑</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">更多操作</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        {!isButton ? (
                          <DropdownMenuItem onSelect={() => onAddChild(node)}>
                            <Plus className="mr-2 h-4 w-4" />
                            新增子级
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem onSelect={() => onEdit(node)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => onDelete(node)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {node.remark ? (
                  <div className="pl-8 pr-2 text-xs text-muted-foreground">
                    {node.remark}
                  </div>
                ) : null}
              </div>
            </div>
            {hasChildren && isExpanded
              ? renderNodes(
                  node.children!,
                  depth + 1,
                  node.menuId,
                  [...ancestors, !isLast],
                  nextPathSegments,
                )
              : null}
          </div>
        );
      });
    },
    [expanded, handleMove, onAddChild, onDelete, onEdit, toggleNode],
  );

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        菜单加载中...
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        暂无菜单数据
      </div>
    );
  }

  return <div className="space-y-1">{renderNodes(nodes)}</div>;
}
