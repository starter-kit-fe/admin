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
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  const tList = useTranslations('DictManagement.typeList');
  const tStatus = useTranslations('DictManagement.status');

  const renderStatusBadge = (status?: string | null) => {
    if (!status || status === '0') {
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
        {tStatus(status)}
      </Badge>
    );
  };

  return (
    <ScrollArea className="h-full p-2">
      <div className="flex flex-col  space-y-1">
        {isLoading && items.length === 0 ? (
          <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
            {tList('loading')}
          </div>
        ) : items.length === 0 ? (
          <Empty className="m-4 h-[180px] border border-dashed border-border/60">
            <EmptyHeader>
              <EmptyTitle>{tList('emptyTitle')}</EmptyTitle>
              <EmptyDescription>{tList('emptyDescription')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          items.map((dict) => {
            const isActive = dict.dictId === selectedId;
            const badge =
              dict.status !== '0' ? renderStatusBadge(dict.status) : null;
            const remarkContent = dict.remark?.trim() || tList('noRemark');
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label={tList('moreAria', {
                              name: dict.dictName,
                            })}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {canAddData ? (
                            <DropdownMenuItem onSelect={() => onAddData(dict)}>
                              <Plus className="mr-2 size-3.5" />
                              {tList('actions.addData')}
                            </DropdownMenuItem>
                          ) : null}
                          {canEditType ? (
                            <DropdownMenuItem onSelect={() => onEdit(dict)}>
                              <Pencil className="mr-2 size-3.5" />
                              {tList('actions.edit')}
                            </DropdownMenuItem>
                          ) : null}
                          {canDeleteType ? (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => onDelete(dict)}
                            >
                              <Trash2 className="mr-2 size-3.5" />
                              {tList('actions.delete')}
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
