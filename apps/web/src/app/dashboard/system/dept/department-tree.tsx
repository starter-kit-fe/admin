'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { DepartmentNode } from './type';

const INDENT_PX = 20;

interface DepartmentTreeProps {
  nodes: DepartmentNode[];
}

export function DepartmentTree({ nodes }: DepartmentTreeProps) {
  const entries = useMemo(() => {
    const list: Array<{ node: DepartmentNode; depth: number }> = [];
    const walk = (items: DepartmentNode[], depth: number) => {
      items.forEach((item) => {
        list.push({ node: item, depth });
        if (item.children && item.children.length > 0) {
          walk(item.children, depth + 1);
        }
      });
    };
    walk(nodes, 0);
    return list;
  }, [nodes]);

  const parentIds = useMemo(() => {
    const ids: number[] = [];
    entries.forEach(({ node }) => {
      if (node.children && node.children.length > 0) {
        ids.push(node.deptId);
      }
    });
    return ids;
  }, [entries]);

  const [expanded, setExpanded] = useState<Set<number>>(() => new Set(parentIds));

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
  }, [parentIds]);

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
    (items: DepartmentNode[], depth = 0): JSX.Element[] => {
      return items.map((item) => {
        const hasChildren = Boolean(item.children && item.children.length > 0);
        const isExpanded = !hasChildren || expanded.has(item.deptId);
        return (
          <div key={item.deptId} className="text-sm">
            <div className="flex items-center gap-2 py-1" style={{ paddingLeft: depth * INDENT_PX }}>
              {hasChildren ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground"
                  onClick={() => toggleNode(item.deptId)}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              ) : (
                <span className="h-6 w-6" />
              )}
              <span className="font-medium text-foreground" title={item.deptName}>
                {item.deptName}
              </span>
              <Badge variant={item.status === '0' ? 'secondary' : 'outline'} className="ml-2 h-5 px-2 text-[11px]">
                {item.status === '0' ? '正常' : '停用'}
              </Badge>
              {item.leader ? <span className="ml-2 text-xs text-muted-foreground">负责人：{item.leader}</span> : null}
            </div>
            {hasChildren && isExpanded ? renderNodes(item.children!, depth + 1) : null}
          </div>
        );
      });
    },
    [expanded, toggleNode],
  );

  if (nodes.length === 0) {
    return <div className="py-6 text-center text-sm text-muted-foreground">暂无部门数据</div>;
  }

  return <div className="space-y-1">{renderNodes(nodes)}</div>;
}
