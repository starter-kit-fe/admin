'use client';

import { StatusTabs } from '@/components/status-tabs';
import { Input } from '@/components/ui/input';

import { STATUS_TABS } from '../constants';
import { useMenuManagementStore, type StatusValue } from '../store';

export function MenuManagementFilters() {
  const { status, setStatus, keyword, setKeyword } = useMenuManagementStore();

  return (
    <section className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <StatusTabs
          value={status}
          onValueChange={(value) => setStatus(value as StatusValue)}
          tabs={STATUS_TABS}
        />
        <Input
          placeholder="搜索菜单名称"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="sm:max-w-sm"
        />
      </div>
    </section>
  );
}
