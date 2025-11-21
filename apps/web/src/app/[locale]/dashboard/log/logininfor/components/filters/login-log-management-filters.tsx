'use client';

import { type StatusTabItem, StatusTabs } from '@/components/status-tabs';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import { Globe, UserRound, X } from 'lucide-react';

interface LoginLogManagementFiltersProps {
  status: string;
  onStatusChange: (value: string) => void;
  userName: string;
  onUserNameChange: (value: string) => void;
  ipaddr: string;
  onIpaddrChange: (value: string) => void;
  statusTabs: StatusTabItem[];
  onReset: () => void;
}

export function LoginLogManagementFilters({
  status,
  onStatusChange,
  userName,
  onUserNameChange,
  ipaddr,
  onIpaddrChange,
  statusTabs,
  onReset,
}: LoginLogManagementFiltersProps) {
  return (
    <div className="space-y-4 rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/60">
      <StatusTabs
        value={status}
        tabs={statusTabs}
        onValueChange={onStatusChange}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <InputGroup className="border-muted bg-muted/60">
          <InputGroupAddon>
            <UserRound className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="按账号模糊查询"
            value={userName}
            onChange={(event) => onUserNameChange(event.target.value)}
          />
          {userName ? (
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="清空账号筛选"
              onClick={() => onUserNameChange('')}
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
            placeholder="输入 IP 地址"
            value={ipaddr}
            onChange={(event) => onIpaddrChange(event.target.value)}
          />
          {ipaddr ? (
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="清空 IP 筛选"
              onClick={() => onIpaddrChange('')}
            >
              <X className="size-3.5" />
            </InputGroupButton>
          ) : null}
        </InputGroup>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-muted-foreground hover:text-foreground"
        >
          重置筛选
        </Button>
      </div>
    </div>
  );
}
