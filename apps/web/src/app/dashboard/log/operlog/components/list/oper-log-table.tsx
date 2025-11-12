'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2 } from 'lucide-react';

import type { OperLog } from '../../type';
import {
  getBusinessTypeLabel,
  getOperLogStatusBadgeVariant,
  getOperLogStatusLabel,
} from '../../utils';

interface OperLogTableProps {
  rows: OperLog[];
  onDelete: (log: OperLog) => void;
}

export function OperLogTable({ rows, onDelete }: OperLogTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[160px]">操作标题</TableHead>
            <TableHead className="min-w-[120px]">业务类型</TableHead>
            <TableHead className="min-w-[120px]">执行结果</TableHead>
            <TableHead className="min-w-[120px]">请求方式</TableHead>
            <TableHead className="min-w-[160px]">操作人员</TableHead>
            <TableHead className="min-w-[220px]">请求地址</TableHead>
            <TableHead className="min-w-[160px]">操作时间</TableHead>
            <TableHead className="min-w-[120px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((item) => (
            <TableRow key={item.operId}>
              <TableCell className="font-medium text-foreground">
                {item.title || '-'}
              </TableCell>
              <TableCell>
                {getBusinessTypeLabel(item.businessType)}
              </TableCell>
              <TableCell>
                <Badge variant={getOperLogStatusBadgeVariant(item.status)}>
                  {getOperLogStatusLabel(item.status)}
                </Badge>
              </TableCell>
              <TableCell>{item.requestMethod}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{item.operName || '-'}</span>
                  {item.operIp ? (
                    <span className="text-xs text-muted-foreground">
                      {item.operIp}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="truncate">{item.operUrl || '-'}</span>
                  {item.operLocation ? (
                    <span className="text-xs text-muted-foreground">
                      {item.operLocation}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{item.operTime ?? '-'}</TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(item)}
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only">删除</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
