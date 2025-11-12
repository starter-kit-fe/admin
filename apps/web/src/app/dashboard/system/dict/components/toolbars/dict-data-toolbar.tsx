'use client';

import type { DictType } from '@/app/dashboard/system/dict/type';
import { type StatusTabItem, StatusTabs } from '@/components/status-tabs';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface DictDataToolbarProps {
  dictType: DictType;
  status: string;
  statusTabs: StatusTabItem[];
  onStatusChange: (value: string) => void;
  onAdd: () => void;
}

export function DictDataToolbar({
  dictType,
  status,
  statusTabs,
  onStatusChange,
  onAdd,
}: DictDataToolbarProps) {
  return (
    <>
      <div>
        <CardTitle className="text-lg font-semibold text-foreground">
          {dictType.dictName}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          类型标识：{dictType.dictType}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <StatusTabs
          value={status}
          onValueChange={onStatusChange}
          tabs={statusTabs}
        />
        <Button type="button" size="sm" onClick={onAdd}>
          <Plus className="mr-2 size-4" />
          新增字典项
        </Button>
      </div>
    </>
  );
}
