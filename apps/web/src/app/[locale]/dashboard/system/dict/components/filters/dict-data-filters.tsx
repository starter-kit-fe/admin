'use client';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Tag, Hash, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DictDataFiltersProps {
  dictLabel: string;
  dictValue: string;
  onDictLabelChange: (value: string) => void;
  onDictValueChange: (value: string) => void;
}

export function DictDataFilters({
  dictLabel,
  dictValue,
  onDictLabelChange,
  onDictValueChange,
}: DictDataFiltersProps) {
  const t = useTranslations('DictManagement.data.filters');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <InputGroup className="w-full border-muted bg-muted/60 sm:w-[200px]">
          <InputGroupAddon>
            <Tag className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={t('labelPlaceholder')}
            value={dictLabel}
            onChange={(event) => onDictLabelChange(event.target.value)}
          />
          {dictLabel ? (
            <InputGroupButton
              size="icon-sm"
              variant="ghost"
              aria-label={t('labelClear')}
              onClick={() => onDictLabelChange('')}
            >
              <X className="size-3.5" />
            </InputGroupButton>
          ) : null}
        </InputGroup>
        <InputGroup className="w-full border-muted bg-muted/60 sm:w-[200px]">
          <InputGroupAddon>
            <Hash className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={t('valuePlaceholder')}
            value={dictValue}
            onChange={(event) => onDictValueChange(event.target.value)}
          />
          {dictValue ? (
            <InputGroupButton
              size="icon-sm"
              variant="ghost"
              aria-label={t('valueClear')}
              onClick={() => onDictValueChange('')}
            >
              <X className="size-3.5" />
            </InputGroupButton>
          ) : null}
        </InputGroup>
      </div>
    </div>
  );
}
