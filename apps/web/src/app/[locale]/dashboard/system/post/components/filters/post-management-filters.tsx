'use client';

import { type StatusTabItem, StatusTabs } from '@/components/status-tabs';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PostManagementFiltersProps {
  status: string;
  tabs: StatusTabItem[];
  onStatusChange: (value: string) => void;
  postName: string;
  onPostNameChange: (value: string) => void;
  disabled?: boolean;
}

export function PostManagementFilters({
  status,
  tabs,
  onStatusChange,
  postName,
  onPostNameChange,
  disabled = false,
}: PostManagementFiltersProps) {
  const t = useTranslations('PostManagement');
  return (
    <div className="rounded-xl border border-border/60 bg-background/80 p-4  sm:p-5">
      <div className="flex flex-col gap-4">
        <StatusTabs value={status} onValueChange={onStatusChange} tabs={tabs} />

        <InputGroup className="w-full border-muted bg-muted/60 sm:max-w-sm">
          <InputGroupAddon>
            <Search className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={t('filters.postName.placeholder')}
            value={postName}
            onChange={(event) => onPostNameChange(event.target.value)}
            disabled={disabled}
          />
          {postName ? (
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('filters.postName.clear')}
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onPostNameChange('')}
              disabled={disabled}
            >
              <X className="size-3.5" />
            </InputGroupButton>
          ) : null}
        </InputGroup>
      </div>
    </div>
  );
}
