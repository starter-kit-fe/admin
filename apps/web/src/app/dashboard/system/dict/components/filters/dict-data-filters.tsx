'use client';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import { Tag, Hash, X } from 'lucide-react';

interface DictDataFiltersProps {
  dictLabel: string;
  dictValue: string;
  onDictLabelChange: (value: string) => void;
  onDictValueChange: (value: string) => void;
  onReset: () => void;
}

export function DictDataFilters({
  dictLabel,
  dictValue,
  onDictLabelChange,
  onDictValueChange,
  onReset,
}: DictDataFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <InputGroup className="border-muted bg-muted/60">
          <InputGroupAddon>
            <Tag className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">字典标签</span>
          </InputGroupAddon>
          <InputGroupInput
            placeholder="输入字典标签"
            value={dictLabel}
            onChange={(event) => onDictLabelChange(event.target.value)}
          />
          {dictLabel ? (
            <InputGroupButton
              size="icon-sm"
              variant="ghost"
              aria-label="清空字典标签"
              onClick={() => onDictLabelChange('')}
            >
              <X className="size-3.5" />
            </InputGroupButton>
          ) : null}
        </InputGroup>
        <InputGroup className="border-muted bg-muted/60">
          <InputGroupAddon>
            <Hash className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">字典键值</span>
          </InputGroupAddon>
          <InputGroupInput
            placeholder="输入字典键值"
            value={dictValue}
            onChange={(event) => onDictValueChange(event.target.value)}
          />
          {dictValue ? (
            <InputGroupButton
              size="icon-sm"
              variant="ghost"
              aria-label="清空字典键值"
              onClick={() => onDictValueChange('')}
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
