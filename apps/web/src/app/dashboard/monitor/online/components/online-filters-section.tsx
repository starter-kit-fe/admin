'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
} from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { TIME_RANGE_OPTIONS, type TimeRangeValue } from '../constants';
import { useOnlineUserManagementStore } from '../store';

export function OnlineUserFiltersSection() {
  const { filterForm, setFilterForm, applyFilters } =
    useOnlineUserManagementStore();

  const userNameTimer = useRef<number | null>(null);
  const ipTimer = useRef<number | null>(null);

  const clearTimer = useCallback((ref: MutableRefObject<number | null>) => {
    if (ref.current) {
      window.clearTimeout(ref.current);
      ref.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer(userNameTimer);
      clearTimer(ipTimer);
    };
  }, [clearTimer]);

  const scheduleApply = useCallback(
    (ref: MutableRefObject<number | null>, nextFilters: typeof filterForm) => {
      clearTimer(ref);
      ref.current = window.setTimeout(() => {
        applyFilters(nextFilters);
      }, 300);
    },
    [applyFilters, clearTimer],
  );

  const handleUserNameChange = (value: string) => {
    const next = { ...filterForm, userName: value };
    setFilterForm(next);
    scheduleApply(userNameTimer, next);
  };

  const handleIpChange = (value: string) => {
    const next = { ...filterForm, ipaddr: value };
    setFilterForm(next);
    scheduleApply(ipTimer, next);
  };

  const handleTimeRangeChange = (value: string) => {
    const next = { ...filterForm, timeRange: value as TimeRangeValue };
    setFilterForm(next);
    applyFilters(next, { force: true });
  };

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="online-user-name">登录账号</Label>
        <Input
          id="online-user-name"
          placeholder="按登录账号筛选"
          value={filterForm.userName}
          onChange={(event) => handleUserNameChange(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="online-ip">登录 IP</Label>
        <Input
          id="online-ip"
          placeholder="按 IP 地址筛选"
          value={filterForm.ipaddr}
          onChange={(event) => handleIpChange(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="online-time-range">活跃时间</Label>
        <Select
          value={filterForm.timeRange}
          onValueChange={handleTimeRangeChange}
        >
          <SelectTrigger id="online-time-range">
            <SelectValue placeholder="全部时间" />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
