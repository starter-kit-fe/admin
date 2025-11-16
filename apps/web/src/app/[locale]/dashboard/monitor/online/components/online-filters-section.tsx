'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
} from 'react';

import { Globe, UserRound, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useOnlineUserManagementStore } from '../store';

export function OnlineUserFiltersSection() {
  const { filterForm, setFilterForm, applyFilters } =
    useOnlineUserManagementStore();
  const t = useTranslations('OnlineUserManagement.filters');

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

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <InputGroup className="border-muted bg-muted/60">
        <InputGroupAddon>
          <UserRound className="size-4 text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder={t('userPlaceholder')}
          value={filterForm.userName}
          onChange={(event) => handleUserNameChange(event.target.value)}
        />
        {filterForm.userName ? (
          <InputGroupButton
            variant="ghost"
            size="icon-sm"
            aria-label={t('userClear')}
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
          placeholder={t('ipPlaceholder')}
          value={filterForm.ipaddr}
          onChange={(event) => handleIpChange(event.target.value)}
        />
        {filterForm.ipaddr ? (
          <InputGroupButton
            variant="ghost"
            size="icon-sm"
            aria-label={t('ipClear')}
            onClick={() => handleIpChange('')}
          >
            <X className="size-3.5" />
          </InputGroupButton>
        ) : null}
      </InputGroup>
    </div>
  );
}
