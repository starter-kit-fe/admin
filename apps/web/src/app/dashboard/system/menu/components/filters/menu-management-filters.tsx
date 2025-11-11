'use client';

import { STATUS_TABS } from '@/app/dashboard/system/menu/constants';
import {
  type StatusValue,
  useMenuManagementStore,
} from '@/app/dashboard/system/menu/store';
import { StatusTabs } from '@/components/status-tabs';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Search, X } from 'lucide-react';
import { useMemo } from 'react';

export function MenuManagementFilters() {
  const { status, setStatus, keyword, setKeyword } = useMenuManagementStore();

  const statusTabs = useMemo(() => STATUS_TABS, []);

  return (
    <section className="rounded-xl border border-border/60 bg-background/80 p-4 sm:p-5">
      <div className="">
        <StatusTabs
          value={status}
          onValueChange={(value) => setStatus(value as StatusValue)}
          tabs={statusTabs}
        />
        <div className="mt-0 md:mt-4">
          <InputGroup className="w-full border-muted bg-muted/60 sm:max-w-sm">
            <InputGroupAddon>
              <Search className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="搜索菜单名称"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            {keyword ? (
              <InputGroupButton
                variant="ghost"
                size="icon-sm"
                aria-label="清空搜索"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setKeyword('')}
              >
                <X className="size-3.5" />
              </InputGroupButton>
            ) : null}
          </InputGroup>
        </div>
      </div>
    </section>
  );
}
