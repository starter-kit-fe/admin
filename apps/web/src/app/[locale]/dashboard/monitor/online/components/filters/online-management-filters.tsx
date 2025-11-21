import { Globe, UserRound, X } from 'lucide-react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

import {
  OnlineAppliedFilters,
  type OnlineFilterChip,
} from './online-applied-filters';
import { useTranslations } from 'next-intl';

interface OnlineManagementFiltersProps {
  userName: string;
  ipaddr: string;
  filterChips: OnlineFilterChip[];
  onUserNameChange: (value: string) => void;
  onIpChange: (value: string) => void;
  onRemoveFilter: (key: OnlineFilterChip['key']) => void;
  onClearFilters: () => void;
}

export function OnlineManagementFilters({
  userName,
  ipaddr,
  filterChips,
  onUserNameChange,
  onIpChange,
  onRemoveFilter,
  onClearFilters,
}: OnlineManagementFiltersProps) {
  const t = useTranslations('OnlineUserManagement');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <InputGroup className="w-full min-w-[240px] max-w-xl border-muted bg-muted/60 sm:w-auto">
          <InputGroupAddon>
            <UserRound className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={t('filters.userPlaceholder')}
            value={userName}
            onChange={(event) => onUserNameChange(event.target.value)}
          />
          {userName ? (
            <InputGroupButton
              variant="ghost"
              size="icon-sm"
              aria-label={t('filters.userClear')}
              onClick={() => onUserNameChange('')}
            >
              <X className="size-3.5" />
            </InputGroupButton>
          ) : null}
        </InputGroup>

        <InputGroup className="w-full min-w-[240px] max-w-xl border-muted bg-muted/60 sm:w-auto">
          <InputGroupAddon>
            <Globe className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={t('filters.ipPlaceholder')}
            value={ipaddr}
            onChange={(event) => onIpChange(event.target.value)}
          />
          {ipaddr ? (
            <InputGroupButton
              variant="ghost"
              size="icon-sm"
              aria-label={t('filters.ipClear')}
              onClick={() => onIpChange('')}
            >
              <X className="size-3.5" />
            </InputGroupButton>
          ) : null}
        </InputGroup>
      </div>

      <OnlineAppliedFilters
        items={filterChips}
        onRemove={onRemoveFilter}
        onClear={onClearFilters}
      />
    </div>
  );
}
