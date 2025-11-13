'use client';

import type { DictType } from '@/app/dashboard/system/dict/type';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';

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
  console.log('DictTypeList');
  const renderStatusBadge = (status?: string | null) => {
    const meta = TYPE_STATUS_TABS.find((tab) => tab.value === status);
    if (!meta || meta.value === 'all') {
      return null;
    }
    return (
      <Badge
        variant="outline"
        className={cn(
          'px-2 py-0 text-[11px] font-medium uppercase',
          status === '0'
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
            : 'border-rose-500/20 bg-rose-500/10 text-rose-600',
        )}
      >
        {meta.label}
      </Badge>
    );
  };

  return (
    <ScrollArea className="h-full p-2">
      <div className="flex flex-col  space-y-1">
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
            const badge =
              dict.status !== '0' ? renderStatusBadge(dict.status) : null;
            const remarkContent = dict.remark?.trim() || '暂无备注';
            const showTooltip = remarkContent.length > 20;
            const remarkNode = (
              <span className="max-w-[220px] truncate text-xs text-muted-foreground">
                {remarkContent}
              </span>
            );

            return (
              <div
                key={dict.dictId}
                className={cn(
                  'group flex flex-col gap-1.5 rounded-lg px-3 py-2 transition-colors',
                  isActive ? 'bg-primary/10' : 'hover:bg-muted/40',
                )}
              >
                <div className="flex items-start gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex h-auto flex-1 flex-col items-start gap-1 bg-transparent px-0 py-0 text-left hover:bg-transparent"
                    onClick={() => onSelect(dict)}
                  >
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {dict.dictName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({dict.dictType})
                      </span>
                    </div>
                    {showTooltip ? (
                      <Tooltip delayDuration={150}>
                        <TooltipTrigger asChild>{remarkNode}</TooltipTrigger>
                        <TooltipContent side="top" align="start">
                          <p className="max-w-xs text-sm text-foreground">
                            {remarkContent}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      remarkNode
                    )}
                  </Button>
                  <div className="flex items-start gap-2">
                    {badge}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground"
                          aria-label="更多操作"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onSelect={() => onAddData(dict)}>
                          <Plus className="mr-2 size-3.5" />
                          新增字典项
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onEdit(dict)}>
                          <Pencil className="mr-2 size-3.5" />
                          编辑字典
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => onDelete(dict)}
                        >
                          <Trash2 className="mr-2 size-3.5" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}
