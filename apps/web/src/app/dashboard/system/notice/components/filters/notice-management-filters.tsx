'use client';

import { StatusTabs } from '@/components/status-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NoticeManagementFiltersProps {
  statusTabs: { value: string; label: string }[];
  noticeTypeTabs: { value: string; label: string }[];
  status: string;
  noticeType: string;
  keyword: string;
  onStatusChange: (value: string) => void;
  onNoticeTypeChange: (value: string) => void;
  onKeywordChange: (value: string) => void;
  onReset: () => void;
}

export function NoticeManagementFilters({
  statusTabs,
  noticeTypeTabs,
  status,
  noticeType,
  keyword,
  onStatusChange,
  onNoticeTypeChange,
  onKeywordChange,
  onReset,
}: NoticeManagementFiltersProps) {
  return (
    <section className="rounded-xl border border-border/60 bg-background/90 p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <StatusTabs
            value={status}
            onValueChange={onStatusChange}
            tabs={statusTabs}
          />
          <StatusTabs
            value={noticeType}
            onValueChange={onNoticeTypeChange}
            tabs={noticeTypeTabs}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              标题搜索
            </label>
            <Input
              placeholder="输入公告标题"
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            重置
          </Button>
        </div>
      </div>
    </section>
  );
}
