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
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';

import { DEFAULT_ROLE_VALUE } from '../utils';

export type FiltersFormState = {
  role: string;
  keyword: string;
};

export type RoleOption = {
  label: string;
  value: string;
};

interface FiltersBarProps {
  value: FiltersFormState;
  onRoleChange: (role: string) => void;
  onKeywordChange: (keyword: string) => void;
  roleOptions: RoleOption[];
}

export function FiltersBar({
  value,
  onRoleChange,
  onKeywordChange,
  roleOptions,
}: FiltersBarProps) {
  const t = useTranslations('UserManagement');

  const handleKeywordClear = () => {
    if (value.keyword) {
      onKeywordChange('');
    }
  };

  const normalizedRoleOptions = roleOptions.map((option) =>
    option.value === DEFAULT_ROLE_VALUE
      ? {
          ...option,
          label: option.label || t('filters.allRoles'),
        }
      : option,
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
        <div className="w-full min-w-0 flex-1 sm:w-64">
          <InputGroup className="w-full border-muted bg-muted/60">
            <InputGroupAddon>
              <Search className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder={t('filters.searchPlaceholder')}
              value={value.keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
            />
            {value.keyword && (
              <InputGroupButton
                variant="ghost"
                size="icon-sm"
                aria-label={t('filters.clearSearch')}
                className="text-muted-foreground hover:text-foreground"
                onClick={handleKeywordClear}
                disabled={!value.keyword}
              >
                <X className="size-3.5" />
              </InputGroupButton>
            )}
          </InputGroup>
        </div>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
        <Select value={value.role} onValueChange={onRoleChange}>
          <SelectTrigger className="h-10 w-full bg-muted flex-1 rounded-lg border-muted sm:w-48">
            <SelectValue placeholder={t('filters.rolePlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {normalizedRoleOptions.map((option) => (
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
