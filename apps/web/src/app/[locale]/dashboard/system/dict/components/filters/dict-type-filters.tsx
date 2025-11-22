'use client';

import { StatusTabs } from '@/components/status-tabs';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { BookText, Code2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DictTypeFiltersProps {
  status: string;
  statusTabs: ReadonlyArray<{ value: string; labelKey: string }>;
  dictName: string;
  dictType: string;
  onStatusChange: (value: string) => void;
  onDictNameChange: (value: string) => void;
  onDictTypeChange: (value: string) => void;
}

export function DictTypeFilters({
  status,
  statusTabs,
  dictName,
  dictType,
  onStatusChange,
  onDictNameChange,
  onDictTypeChange,
}: DictTypeFiltersProps) {
  const t = useTranslations('DictManagement');
  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card/95 p-4 sm:p-5">
      <StatusTabs
        value={status}
        onValueChange={onStatusChange}
        tabs={statusTabs.map((tab) => ({
          value: tab.value,
          label: t(tab.labelKey),
        }))}
      />
      <div className="flex flex-wrap gap-3">
        <InputGroup className="border-muted bg-muted/60 sm:max-w-xs">
          <InputGroupAddon>
            <BookText className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={t('typeFilters.dictNamePlaceholder')}
            value={dictName}
            onChange={(event) => onDictNameChange(event.target.value)}
          />
          {dictName ? (
            <InputGroupButton
              size="icon-sm"
              variant="ghost"
              aria-label={t('typeFilters.dictNameClear')}
              onClick={() => onDictNameChange('')}
            >
              <X className="size-3.5" />
            </InputGroupButton>
          ) : null}
        </InputGroup>
        <InputGroup className="border-muted bg-muted/60 sm:max-w-xs">
          <InputGroupAddon>
            <Code2 className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={t('typeFilters.dictTypePlaceholder')}
            value={dictType}
            onChange={(event) => onDictTypeChange(event.target.value)}
          />
          {dictType ? (
            <InputGroupButton
              size="icon-sm"
              variant="ghost"
              aria-label={t('typeFilters.dictTypeClear')}
              onClick={() => onDictTypeChange('')}
            >
              <X className="size-3.5" />
            </InputGroupButton>
          ) : null}
        </InputGroup>
      </div>
    </div>
  );
}
