'use client';

import { type StatusTabItem, StatusTabs } from '@/components/status-tabs';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { KeyRound, Search, X } from 'lucide-react';

interface ConfigManagementFiltersProps {
  configType: string;
  onConfigTypeChange: (value: string) => void;
  configName: string;
  onConfigNameChange: (value: string) => void;
  configKey: string;
  onConfigKeyChange: (value: string) => void;
  typeTabs: StatusTabItem[];
  onReset: () => void;
}

export function ConfigManagementFilters({
  configType,
  onConfigTypeChange,
  configName,
  onConfigNameChange,
  configKey,
  onConfigKeyChange,
  typeTabs,
  onReset,
}: ConfigManagementFiltersProps) {
  return (
    <div className="space-y-4 rounded-xl bg-card p-4">
      <StatusTabs
        value={configType}
        onValueChange={onConfigTypeChange}
        tabs={typeTabs}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <InputGroup className="border-muted bg-muted/60">
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
        <InputGroup className="border-muted bg-muted/60">
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
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          重置
        </Button>
      </div>
    </div>
  );
}
