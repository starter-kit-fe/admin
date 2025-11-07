'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusTabs } from '@/components/status-tabs';

import {
  DEFAULT_DEBOUNCE_MS,
  LOGIN_LOG_STATUS_TABS,
} from '../constants';
import {
  type LoginLogStatusValue,
  useLoginLogManagementStore,
} from '../store';

export function LoginLogFiltersSection() {
  const {
    status,
    setStatus,
    filterForm,
    setFilterForm,
    applyFilters,
    resetFilters,
  } = useLoginLogManagementStore();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      applyFilters({
        userName: filterForm.userName.trim(),
        ipaddr: filterForm.ipaddr.trim(),
      });
    }, DEFAULT_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [applyFilters, filterForm.userName, filterForm.ipaddr]);

  return (
    <section className="rounded-xl border border-border/60 bg-background/90 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-6">
        <StatusTabs
          value={status}
          tabs={LOGIN_LOG_STATUS_TABS}
          onValueChange={(value) =>
            setStatus(value as LoginLogStatusValue)
          }
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              登录账号
            </label>
            <Input
              placeholder="按账号模糊查询"
              value={filterForm.userName}
              onChange={(event) =>
                setFilterForm((prev) => ({
                  ...prev,
                  userName: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              登录 IP
            </label>
            <Input
              placeholder="输入 IP 地址"
              value={filterForm.ipaddr}
              onChange={(event) =>
                setFilterForm((prev) => ({
                  ...prev,
                  ipaddr: event.target.value,
                }))
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
