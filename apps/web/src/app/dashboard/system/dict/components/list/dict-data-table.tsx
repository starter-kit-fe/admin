'use client';

import type { DictData } from '@/app/dashboard/system/dict/type';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Edit2, Trash2 } from 'lucide-react';

import { DATA_STATUS_TABS } from '../../constants';

interface DictDataTableProps {
  rows: DictData[];
  isLoading: boolean;
  onEdit: (item: DictData) => void;
  onDelete: (item: DictData) => void;
  className?: string;
}

export function DictDataTable({
  rows,
  isLoading,
  onEdit,
  onDelete,
  className,
}: DictDataTableProps) {
  const renderStatusBadge = (status?: string | null) => {
    const meta = DATA_STATUS_TABS.find((tab) => tab.value === status);
    if (!meta || meta.value === 'all') {
      return null;
    }
    const tone =
      status === '0'
        ? 'bg-primary/10 text-primary'
        : 'bg-destructive/10 text-destructive';

    return (
      <Badge
        variant="outline"
        className={cn('border-transparent px-2 py-0 text-[11px] font-medium', tone)}
      >
        {meta.label}
      </Badge>
    );
  };

  return (
    <div
      className={cn(
        'h-full overflow-hidden rounded-xl border border-border/50',
        className,
      )}
    >
      <ScrollArea className="h-full">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">标签</TableHead>
              <TableHead className="w-[140px]">键值</TableHead>
              <TableHead className="w-[100px]">排序</TableHead>
              <TableHead className="w-[120px]">是否默认</TableHead>
              <TableHead className="min-w-[180px]">备注</TableHead>
              <TableHead className="w-[120px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center align-middle"
                >
                  <Empty className="border-0 bg-transparent p-4">
                    <EmptyHeader>
                      <EmptyTitle>
                        {isLoading ? '字典数据加载中' : '暂无字典项'}
                      </EmptyTitle>
                      <EmptyDescription>
                        {isLoading
                          ? '正在获取字典项，请稍候。'
                          : '请先新增一条字典项以开始管理。'}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((item) => (
                <TableRow key={item.dictCode}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{item.dictLabel}</span>
                      {renderStatusBadge(item.status)}
                    </div>
                  </TableCell>
                  <TableCell>{item.dictValue}</TableCell>
                  <TableCell>{item.dictSort ?? 0}</TableCell>
                  <TableCell>
                    {item.isDefault === 'Y' ? (
                      <Badge
                        variant="outline"
                        className="border-transparent bg-primary/10 px-2 py-0 text-xs text-primary"
                      >
                        默认
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">否</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.remark ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => onEdit(item)}
                      >
                        <Edit2 className="size-3.5" />
                        编辑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs text-destructive hover:text-destructive"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="size-3.5" />
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
