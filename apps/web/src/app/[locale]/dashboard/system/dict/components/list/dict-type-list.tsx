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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
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
  const { hasPermission } = usePermissions();
  const canAddData = hasPermission('system:dict:add');
  const canEditType = hasPermission('system:dict:edit');
  const canDeleteType = hasPermission('system:dict:remove');
  const showActions = canAddData || canEditType || canDeleteType;
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
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-lg border border-dashed border-border/70 bg-muted/30 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
                <Skeleton className="h-3 w-48 rounded" />
              </div>
            ))}
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
                    {showActions ? (
                      <DictTypeActions
                        dict={dict}
                        canAddData={canAddData}
                        canEditType={canEditType}
                        canDeleteType={canDeleteType}
                        onAddData={onAddData}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ) : null}
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

function DictTypeActions({
  dict,
  canAddData,
  canEditType,
  canDeleteType,
  onAddData,
  onEdit,
  onDelete,
}: {
  dict: DictType;
  canAddData: boolean;
  canEditType: boolean;
  canDeleteType: boolean;
  onAddData: (dict: DictType) => void;
  onEdit: (dict: DictType) => void;
  onDelete: (dict: DictType) => void;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label="更多操作"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-auto w-full max-w-full rounded-t-2xl border-t p-0"
        >
          <SheetHeader className="px-4 pb-2 pt-3 text-left">
            <SheetTitle>操作</SheetTitle>
            <SheetDescription>选择要对该字典类型执行的操作。</SheetDescription>
          </SheetHeader>
          <SheetFooter className="mt-0 flex-col gap-2 px-4 pb-4">
            {canAddData ? (
              <Button
                variant="secondary"
                className="w-full justify-between"
                onClick={() => {
                  onAddData(dict);
                  setOpen(false);
                }}
              >
                <span className="flex items-center gap-2">
                  <Plus className="size-4" />
                  新增字典项
                </span>
                <span className="text-xs text-muted-foreground">添加新的键值</span>
              </Button>
            ) : null}
            {canEditType ? (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  onEdit(dict);
                  setOpen(false);
                }}
              >
                <Pencil className="size-4" />
                编辑字典
              </Button>
            ) : null}
            {canDeleteType ? (
              <Button
                variant="destructive"
                className="w-full justify-start gap-2"
                onClick={() => {
                  onDelete(dict);
                  setOpen(false);
                }}
              >
                <Trash2 className="size-4" />
                删除
              </Button>
            ) : null}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
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
        {canAddData ? (
          <DropdownMenuItem onSelect={() => onAddData(dict)}>
            <Plus className="mr-2 size-3.5" />
            新增字典项
          </DropdownMenuItem>
        ) : null}
        {canEditType ? (
          <DropdownMenuItem onSelect={() => onEdit(dict)}>
            <Pencil className="mr-2 size-3.5" />
            编辑字典
          </DropdownMenuItem>
        ) : null}
        {canDeleteType ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => onDelete(dict)}
          >
            <Trash2 className="mr-2 size-3.5" />
            删除
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
