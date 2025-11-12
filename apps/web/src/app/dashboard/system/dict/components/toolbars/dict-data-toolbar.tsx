'use client';

import { type StatusTabItem, StatusTabs } from '@/components/status-tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DictDataToolbarProps {
  status: string;
  statusTabs: StatusTabItem[];
  onStatusChange: (value: string) => void;
  onAdd: () => void;
}

export function DictDataToolbar({
  status,
  statusTabs,
  onStatusChange,
  onAdd,
}: DictDataToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <StatusTabs value={status} onValueChange={onStatusChange} tabs={statusTabs} />
      <Button type="button" size="sm" onClick={onAdd} className="self-start lg:self-auto">
        <Plus className="mr-2 size-4" />
        新增字典项
      </Button>
    </div>
  );
}
