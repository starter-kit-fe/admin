'use client';

import { type StatusTabItem, StatusTabs } from '@/components/status-tabs';
import { Card } from '@/components/ui/card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DepartmentFiltersProps {
  status: string;
  tabs: StatusTabItem[];
  onStatusChange: (value: string) => void;
  keyword: string;
  onKeywordChange: (value: string) => void;
}

export function DepartmentFilters({
  status,
  tabs,
  onStatusChange,
  keyword,
  onKeywordChange,
}: DepartmentFiltersProps) {
  const t = useTranslations('DepartmentManagement.filters');

  return (
    <Card className="rounded-xl border border-border/60 bg-card p-4 shadow-none dark:border-border/40 sm:p-5">
      <div className="flex flex-col gap-4">
        <StatusTabs value={status} onValueChange={onStatusChange} tabs={tabs} />
        <InputGroup className="w-full border-muted bg-muted/60 sm:max-w-sm">
          <InputGroupAddon>
            <Search className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={t('searchPlaceholder')}
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
          />
          {keyword ? (
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('clearSearch')}
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onKeywordChange('')}
            >
              <X className="size-3.5" />
            </InputGroupButton>
          ) : null}
        </InputGroup>
      </div>
    </Card>
  );
}
