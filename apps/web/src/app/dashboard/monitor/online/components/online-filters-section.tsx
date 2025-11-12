'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
} from 'react';

import { Clock3, Globe, UserRound, X } from 'lucide-react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
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
      <InputGroup className="border-muted bg-muted/60">
        <InputGroupAddon>
          <UserRound className="size-4 text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="按登录账号筛选"
          value={filterForm.userName}
          onChange={(event) => handleUserNameChange(event.target.value)}
        />
        {filterForm.userName ? (
          <InputGroupButton
            variant="ghost"
            size="icon-sm"
            aria-label="清空账号筛选"
            onClick={() => handleUserNameChange('')}
          >
            <X className="size-3.5" />
          </InputGroupButton>
        ) : null}
      </InputGroup>

      <InputGroup className="border-muted bg-muted/60">
        <InputGroupAddon>
          <Globe className="size-4 text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="按 IP 地址筛选"
          value={filterForm.ipaddr}
          onChange={(event) => handleIpChange(event.target.value)}
        />
        {filterForm.ipaddr ? (
          <InputGroupButton
            variant="ghost"
            size="icon-sm"
            aria-label="清空 IP 筛选"
            onClick={() => handleIpChange('')}
          >
            <X className="size-3.5" />
          </InputGroupButton>
        ) : null}
      </InputGroup>

      <InputGroup className="border-muted bg-muted/60">
        <InputGroupAddon>
          <Clock3 className="size-4 text-muted-foreground" />
        </InputGroupAddon>
        <Select
          value={filterForm.timeRange}
          onValueChange={handleTimeRangeChange}
        >
          <SelectTrigger className="h-9 w-full border-0 bg-transparent px-0 text-sm shadow-none focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder="全部时间" />
          </SelectTrigger>
          <SelectContent align="end">
            {TIME_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </InputGroup>
    </div>
  );
}
