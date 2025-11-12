'use client';

import type { DictType } from '@/app/dashboard/system/dict/type';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Edit2, Plus, Trash2 } from 'lucide-react';

import { TYPE_STATUS_TABS } from '../../constants';

interface DictTypeListProps {
  items: DictType[];
  selectedId: number | null;
  isLoading: boolean;
  onSelect: (dict: DictType) => void;
  onEdit: (dict: DictType) => void;
  onAddData: (dict: DictType) => void;
  onDelete: (dict: DictType) => void;
}

export function DictTypeList({
  items,
  selectedId,
  isLoading,
  onSelect,
  onEdit,
  onAddData,
  onDelete,
}: DictTypeListProps) {
  const renderStatusBadge = (status?: string | null) => {
    const meta = TYPE_STATUS_TABS.find((tab) => tab.value === status);
    if (!meta || meta.value === 'all') {
      return null;
    }
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-transparent px-2 py-0 text-[11px] font-medium',
          status === '0'
            ? 'bg-emerald-500/10 text-emerald-600'
            : 'bg-rose-500/10 text-rose-600',
        )}
      >
        {meta.label}
      </Badge>
    );
  };

  return (
    <ScrollArea className="h-[420px]">
      <div className="flex flex-col divide-y divide-border/60">
        {isLoading && items.length === 0 ? (
          <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
            字典类型加载中...
          </div>
        ) : items.length === 0 ? (
          <Empty className="m-4 h-[180px] border border-dashed border-border/60">
            <EmptyHeader>
              <EmptyTitle>暂无字典类型</EmptyTitle>
              <EmptyDescription>
                点击右上角“新建”快速添加第一条字典。
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          items.map((dict) => {
            const isActive = dict.dictId === selectedId;
            return (
              <div
                key={dict.dictId}
                className={cn(
                  'flex flex-col gap-2 px-4 py-3 transition-colors',
                  isActive
                    ? 'bg-primary/5 text-primary-foreground'
                    : 'hover:bg-muted/40',
                )}
              >
                <button
                  type="button"
                  className="flex w-full flex-col items-start gap-1 text-left"
                  onClick={() => onSelect(dict)}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      {dict.dictName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dict.dictType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {renderStatusBadge(dict.status)}
                    {dict.remark ? (
                      <span className="line-clamp-1">{dict.remark}</span>
                    ) : null}
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(dict)}
                    className="h-7 gap-1 px-2 text-xs"
                  >
                    <Edit2 className="size-3.5" />
                    编辑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddData(dict)}
                    className="h-7 gap-1 px-2 text-xs"
                  >
                    <Plus className="size-3.5" />
                    新增字典项
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(dict)}
                    className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    删除
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}
