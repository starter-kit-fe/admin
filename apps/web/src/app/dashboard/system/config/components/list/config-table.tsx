'use client';

import { CONFIG_TYPE_TABS } from '../../constants';
import type { SystemConfig } from '../../type';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit2, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const CONFIG_TYPE_META = CONFIG_TYPE_TABS.reduce<Record<string, string>>(
  (acc, tab) => {
    if (tab.value !== 'all') {
      acc[tab.value] = tab.label;
    }
    return acc;
  },
  {},
);

interface ConfigTableProps {
  rows: SystemConfig[];
  isLoading: boolean;
  onEdit: (config: SystemConfig) => void;
  onDelete: (config: SystemConfig) => void;
}

function renderTypeBadge(type: string) {
  const label = CONFIG_TYPE_META[type];
  if (!label) {
    return null;
  }
  const isSystem = type === 'Y';
  return (
    <Badge
      variant="outline"
      className={
        isSystem
          ? 'border-blue-500/40 bg-blue-500/10 text-blue-600'
          : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600'
      }
    >
      {label}
    </Badge>
  );
}

export function ConfigTable({
  rows,
  isLoading,
  onEdit,
  onDelete,
}: ConfigTableProps) {
  return (
    <Card className="border border-border/60 dark:border-border/40">
      <CardContent className="px-0 py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">参数名称</TableHead>
              <TableHead className="min-w-[160px]">参数键名</TableHead>
              <TableHead className="min-w-[220px]">参数键值</TableHead>
              <TableHead className="w-[120px]">类型</TableHead>
              <TableHead className="w-[200px] max-w-[200px]">备注</TableHead>
              <TableHead className="sticky right-0 z-20 w-[120px] bg-card text-right">
                操作
              </TableHead>
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
                        {isLoading ? '参数数据加载中' : '暂无参数记录'}
                      </EmptyTitle>
                      <EmptyDescription>
                        {isLoading
                          ? '正在获取系统参数，请稍候。'
                          : '先新增一条参数即可在此维护。'}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((config) => {
                const remark = config.remark?.trim();
                return (
                  <TableRow key={config.configId} className="group">
                    <TableCell>{config.configName}</TableCell>
                    <TableCell>{config.configKey}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-xs">
                        {config.configValue}
                      </code>
                    </TableCell>
                    <TableCell>{renderTypeBadge(config.configType)}</TableCell>
                    <TableCell className="w-[200px] text-xs text-muted-foreground">
                      {remark ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block max-w-[200px] truncate">
                              {remark}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="end"
                            className="max-w-xs break-words text-left"
                          >
                            {remark}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="sticky right-0 z-10 w-[120px] bg-card text-right group-hover:bg-muted/50">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => onEdit(config)}
                        >
                          <Edit2 className="size-3.5" />
                          编辑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-destructive hover:text-destructive"
                          onClick={() => onDelete(config)}
                        >
                          <Trash2 className="size-3.5" />
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
