'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

import { DEFAULT_DEBOUNCE_MS } from '../../constants';
import {
  type CacheListFilterState,
  useCacheListManagementStore,
} from '../../store';

export function CacheListFiltersSection() {
  const {
    filterForm,
    setFilterForm,
    applyFilters,
    appliedFilters,
    resetFilters,
  } = useCacheListManagementStore();
  const timerRef = useRef<number | null>(null);
  const tFilters = useTranslations('CacheMonitor.list.filters');

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  const scheduleApply = useCallback(
    (nextFilters: CacheListFilterState) => {
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        applyFilters(
          {
            pattern: nextFilters.pattern.trim(),
          },
          { force: false },
        );
      }, DEFAULT_DEBOUNCE_MS);
    },
    [applyFilters, clearTimer],
  );

  const handlePatternChange = (value: string) => {
    const next = { ...filterForm, pattern: value };
    setFilterForm(next);
    scheduleApply(next);
  };

  const handleRemoveFilter = () => {
    const next: CacheListFilterState = { ...filterForm, pattern: '' };
    setFilterForm(next);
    clearTimer();
    applyFilters({ pattern: '' }, { force: true });
  };

  const handleResetFilters = () => {
    clearTimer();
    resetFilters();
  };

  const appliedPattern = useMemo(
    () => appliedFilters.pattern.trim(),
    [appliedFilters.pattern],
  );
  const hasAppliedPattern = appliedPattern.length > 0;

  const isDirty = filterForm.pattern.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <InputGroup className="border-muted bg-muted/60 lg:flex-1">
          <InputGroupAddon>
            <Search className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={tFilters('placeholder')}
            value={filterForm.pattern}
            onChange={(event) => handlePatternChange(event.target.value)}
          />
          {filterForm.pattern ? (
            <InputGroupButton
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              aria-label={tFilters('clearAria')}
              onClick={handleRemoveFilter}
            >
              <X className="size-3.5" />
            </InputGroupButton>
          ) : null}
        </InputGroup>
        <Button
          type="button"
          variant="ghost"
          onClick={handleResetFilters}
          disabled={!isDirty && !hasAppliedPattern}
        >
          {tFilters('reset')}
        </Button>
      </div>
      {hasAppliedPattern ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/30 px-4 py-3">
          <Badge
            variant="secondary"
            className="flex items-center gap-2 rounded-full px-3 py-1 text-sm"
          >
            <span className="font-medium text-muted-foreground">
              {tFilters('patternLabel')}
            </span>
            <span className="text-foreground">{appliedPattern}</span>
            <button
              type="button"
              onClick={handleRemoveFilter}
              className="text-muted-foreground/70 transition-colors hover:text-foreground"
              aria-label={tFilters('removePatternAria')}
            >
              <X className="size-3.5" />
            </button>
          </Badge>
          <Button
            type="button"
            variant="link"
            className="px-0 text-sm text-destructive hover:text-destructive"
            onClick={handleRemoveFilter}
          >
            {tFilters('clear')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
