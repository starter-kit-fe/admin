'use client';

import { type StatusTabItem, StatusTabs } from '@/components/status-tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DictDataToolbarProps {
  status: string;
  statusTabs: StatusTabItem[];
  onStatusChange: (value: string) => void;
  onAdd: () => void;
  addLabel: string;
}

export function DictDataToolbar({
  status,
  statusTabs,
  onStatusChange,
  onAdd,
  addLabel,
}: DictDataToolbarProps) {
  return (
    <div className="flex w-full  gap-3 lg:flex-row items-center justify-between">
      <StatusTabs
        value={status}
        onValueChange={onStatusChange}
        tabs={statusTabs}
      />
      <Button
        type="button"
        size="sm"
        onClick={onAdd}
        className="self-start lg:self-auto"
      >
        <Plus className="mr-2 size-4" />
        {addLabel}
      </Button>
    </div>
  );
}
