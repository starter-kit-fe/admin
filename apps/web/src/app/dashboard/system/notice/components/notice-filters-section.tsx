'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusTabs } from '@/components/status-tabs';

import {
  NOTICE_STATUS_TABS,
  NOTICE_TYPE_TABS,
  DEFAULT_DEBOUNCE_MS,
} from '../constants';
import {
  useNoticeManagementStore,
  type NoticeStatusValue,
  type NoticeTypeValue,
} from '@/app/dashboard/system/notice/store';

export function NoticeFiltersSection() {
  const {
    status,
    setStatus,
    noticeType,
    setNoticeType,
    filterForm,
    setFilterForm,
    applyFilters,
    resetFilters,
  } = useNoticeManagementStore();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      applyFilters({ noticeTitle: filterForm.noticeTitle.trim() });
    }, DEFAULT_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [applyFilters, filterForm.noticeTitle]);

  return (
    <section className="rounded-xl border border-border/60 bg-background/90 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <StatusTabs
            value={status}
            onValueChange={(value) => setStatus(value as NoticeStatusValue)}
            tabs={NOTICE_STATUS_TABS}
          />
          <StatusTabs
            value={noticeType}
            onValueChange={(value) =>
              setNoticeType(value as NoticeTypeValue)
            }
            tabs={NOTICE_TYPE_TABS}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              标题搜索
            </label>
            <Input
              placeholder="输入公告标题"
              value={filterForm.noticeTitle}
              onChange={(event) =>
                setFilterForm({ noticeTitle: event.target.value })
              }
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetFilters()}
          >
            重置
          </Button>
        </div>
      </div>
    </section>
  );
}
