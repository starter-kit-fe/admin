import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';

import type { MenuTreeNode } from '@/app/dashboard/system/menu/type';

interface MenuPermissionTreeProps {
  nodes: MenuTreeNode[];
  value: number[];
  onChange: (menuIds: number[]) => void;
  disabled?: boolean;
}

const INDENT_PX = 20;

type FlatNode = { node: MenuTreeNode; parentId: number };

export function MenuPermissionTree({ nodes, value, onChange, disabled }: MenuPermissionTreeProps) {
  const flatNodes = useMemo(() => flattenNodes(nodes), [nodes]);
  const allIds = useMemo(
    () => flatNodes.map((entry) => entry.node.menuId),
    [flatNodes],
  );
  const parentMap = useMemo(() => buildParentMap(flatNodes), [flatNodes]);
  const childrenMap = useMemo(() => buildChildrenMap(flatNodes), [flatNodes]);
  const parentIds = useMemo(() => extractParentIds(flatNodes), [flatNodes]);
  const parentKey = useMemo(() => parentIds.join(','), [parentIds]);

  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [linkage, setLinkage] = useState(true);

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set<number>(prev);
      let changed = false;
      parentIds.forEach((id) => {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [parentIds, parentKey]);

  const valueSet = useMemo(() => new Set(value), [value]);
  const expandedAll = useMemo(
    () => parentIds.every((id) => expanded.has(id)),
    [expanded, parentIds],
  );
  const allSelected = useMemo(
    () => allIds.length > 0 && allIds.every((id) => valueSet.has(id)),
    [allIds, valueSet],
  );

  const collectDescendants = useCallback(
    (id: number): number[] => {
      const result: number[] = [];
      const queue: number[] = [...(childrenMap.get(id) ?? [])];
      while (queue.length > 0) {
        const current = queue.shift()!;
        result.push(current);
        const children = childrenMap.get(current);
        if (children) {
          queue.push(...children);
        }
      }
      return result;
    },
    [childrenMap],
  );

  const collectAncestors = useCallback(
    (id: number): number[] => {
      const result: number[] = [];
      let current = parentMap.get(id);
      while (current && current > 0) {
        result.push(current);
        current = parentMap.get(current);
      }
      return result;
    },
    [parentMap],
  );

  const applySelection = useCallback(
    (menuId: number, checked: boolean) => {
      const next = new Set(valueSet);
      if (checked) {
        next.add(menuId);
        if (linkage) {
          collectDescendants(menuId).forEach((childId) => next.add(childId));
          collectAncestors(menuId).forEach((ancestorId) => next.add(ancestorId));
        }
      } else {
        next.delete(menuId);
        if (linkage) {
          collectDescendants(menuId).forEach((childId) => next.delete(childId));
          collectAncestors(menuId).forEach((ancestorId) => {
            const children = childrenMap.get(ancestorId) ?? [];
            const hasCheckedChild = children.some((childId) => next.has(childId));
            if (!hasCheckedChild) {
              next.delete(ancestorId);
            }
          });
        }
      }
      const sorted = Array.from(next).sort((a, b) => a - b);
      onChange(sorted);
    },
    [childrenMap, collectAncestors, collectDescendants, linkage, onChange, valueSet],
  );

  const handleToggleExpandAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setExpanded(new Set(parentIds));
      } else {
        setExpanded(new Set());
      }
    },
    [parentIds],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      const next = checked ? [...allIds] : [];
      onChange(next);
    },
    [allIds, onChange],
  );

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

  const renderNodes = useCallback(
    (items: MenuTreeNode[], depth = 0): ReactElement[] => {
      return items.map((item) => {
        const hasChildren = Boolean(item.children && item.children.length > 0);
        const isExpanded = !hasChildren || expanded.has(item.menuId);
        const checked = valueSet.has(item.menuId);

        return (
          <div key={item.menuId} className="text-sm">
            <div className="flex items-center gap-2 py-1" style={{ paddingLeft: depth * INDENT_PX }}>
              {hasChildren ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground"
                  onClick={() => toggleNode(item.menuId)}
                  disabled={disabled}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              ) : (
                <span className="h-6 w-6" />
              )}
              <Checkbox
                checked={checked}
                onCheckedChange={(nextChecked) => applySelection(item.menuId, nextChecked === true)}
                disabled={disabled}
              />
              <span className="truncate text-foreground" title={item.menuName}>
                {item.menuName}
              </span>
              {item.menuType === 'F' ? (
                <Badge variant="secondary" className="ml-1 h-5 px-2 text-[11px]">
                  按钮
                </Badge>
              ) : null}
              {item.perms ? (
                <span className="ml-auto truncate text-xs text-muted-foreground" title={item.perms}>
                  {item.perms}
                </span>
              ) : null}
            </div>
            {hasChildren && isExpanded ? renderNodes(item.children!, depth + 1) : null}
          </div>
        );
      });
    },
    [applySelection, disabled, expanded, toggleNode, valueSet],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="font-medium text-foreground">菜单权限</span>
        <label className="flex items-center gap-2 text-muted-foreground">
          <Checkbox
            checked={expandedAll}
            onCheckedChange={(next) => handleToggleExpandAll(next === true)}
            disabled={disabled || parentIds.length === 0}
          />
          展开/折叠
        </label>
        <label className="flex items-center gap-2 text-muted-foreground">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(next) => handleSelectAll(next === true)}
            disabled={disabled || allIds.length === 0}
          />
          全选/全不选
        </label>
        <label className="flex items-center gap-2 text-muted-foreground">
          <Checkbox
            checked={linkage}
            onCheckedChange={(next) => setLinkage(next === true)}
            disabled={disabled}
          />
          父子联动
        </label>
      </div>
      <div className="max-h-80 space-y-1 overflow-y-auto rounded-lg border border-border/60 bg-muted/10 p-3">
        {nodes.length === 0 ? (
          <Empty className="h-48 border-0 bg-transparent p-2">
            <EmptyHeader>
              <EmptyTitle>暂无可配置菜单</EmptyTitle>
              <EmptyDescription>启用菜单后可在此为角色分配权限。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          renderNodes(nodes)
        )}
      </div>
    </div>
  );
}

function flattenNodes(nodes: MenuTreeNode[]): FlatNode[] {
  const entries: FlatNode[] = [];
  const walk = (items: MenuTreeNode[], parentId: number) => {
    items.forEach((item) => {
      entries.push({ node: item, parentId });
      if (item.children && item.children.length > 0) {
        walk(item.children, item.menuId);
      }
    });
  };
  walk(nodes, 0);
  return entries;
}

function buildParentMap(entries: FlatNode[]) {
  const map = new Map<number, number>();
  entries.forEach(({ node, parentId }) => {
    map.set(node.menuId, parentId);
  });
  return map;
}

function buildChildrenMap(entries: FlatNode[]) {
  const map = new Map<number, number[]>();
  entries.forEach(({ node, parentId }) => {
    if (!map.has(parentId)) {
      map.set(parentId, []);
    }
    map.get(parentId)!.push(node.menuId);
  });
  return map;
}

function extractParentIds(entries: FlatNode[]) {
  const ids: number[] = [];
  entries.forEach(({ node }) => {
    if (node.children && node.children.length > 0) {
      ids.push(node.menuId);
    }
  });
  return ids;
}
