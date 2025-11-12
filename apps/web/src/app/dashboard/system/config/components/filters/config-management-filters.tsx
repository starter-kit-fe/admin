'use client';

import { type StatusTabItem, StatusTabs } from '@/components/status-tabs';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { KeyRound, Search, X } from 'lucide-react';

import {
  ConfigAppliedFilters,
  type ConfigFilterChip,
  type ConfigFilterKey,
} from './applied-filters';

interface ConfigManagementFiltersProps {
  configType: string;
  onConfigTypeChange: (value: string) => void;
  configName: string;
  onConfigNameChange: (value: string) => void;
  configKey: string;
  onConfigKeyChange: (value: string) => void;
  typeTabs: StatusTabItem[];
  appliedFilters: ConfigFilterChip[];
  onRemoveFilter: (key: ConfigFilterKey) => void;
}

export function ConfigManagementFilters({
  configType,
  onConfigTypeChange,
  configName,
  onConfigNameChange,
  configKey,
  onConfigKeyChange,
  typeTabs,
  appliedFilters,
  onRemoveFilter,
}: ConfigManagementFiltersProps) {
  return (
    <div className="space-y-4 rounded-xl bg-card p-4">
      <StatusTabs
        value={configType}
        onValueChange={onConfigTypeChange}
        tabs={typeTabs}
      />
      <div className="flex flex-col gap-3 lg:flex-row">
        <InputGroup className="border-muted bg-muted/60 lg:flex-1">
          <InputGroupAddon>
            <Search className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="按名称搜索参数"
            value={configName}
            onChange={(event) => onConfigNameChange(event.target.value)}
          />
          {configName ? (
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onConfigNameChange('')}
            >
              <X className="size-3.5" />
            </InputGroupButton>
          ) : null}
        </InputGroup>
        <InputGroup className="border-muted bg-muted/60 lg:flex-1">
          <InputGroupAddon>
            <KeyRound className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="按配置键搜索"
            value={configKey}
            onChange={(event) => onConfigKeyChange(event.target.value)}
          />
          {configKey ? (
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onConfigKeyChange('')}
            >
              <X className="size-3.5" />
            </InputGroupButton>
          ) : null}
        </InputGroup>
      </div>
      <ConfigAppliedFilters
        items={appliedFilters}
        onRemove={onRemoveFilter}
      />
    </div>
  );
}
