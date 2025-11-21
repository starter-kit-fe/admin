'use client';

import { useEffect, useMemo } from 'react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import type { MenuParentOption } from './types';
import type { MenuType } from '@/app/dashboard/system/menu/type';

interface MenuParentTreeSelectProps {
  options: MenuParentOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  menuType: MenuType;
}

export function MenuParentTreeSelect({
  options,
  value,
  onChange,
  disabled,
  menuType,
}: MenuParentTreeSelectProps) {
  const t = useTranslations('MenuManagement');
  const formattedOptions = useMemo(
    () =>
      options.map((option) => ({
        ...option,
        displayLabel:
          option.value === '0' ? option.label : option.path.join(' / '),
        fullPath: option.path.join(' / '),
      })),
    [options],
  );

  const filteredOptions = useMemo(() => {
    return formattedOptions.filter((option) => {
      if (option.value === '0') {
        return menuType !== 'F';
      }
      if (option.disabled) {
        return false;
      }
      const parentType = option.menuType;
      if (!parentType) {
        return true;
      }
      if (menuType === 'F') {
        return parentType === 'C';
      }
      if (menuType === 'C') {
        return parentType === 'M';
      }
      if (menuType === 'M') {
        return parentType === 'M';
      }
      return true;
    });
  }, [formattedOptions, menuType]);

  useEffect(() => {
    if (filteredOptions.length === 0) {
      if (value !== '') {
        onChange('');
      }
      return;
    }

    const isAllowed = filteredOptions.some((option) => option.value === value);
    if (!isAllowed) {
      const rootOption = filteredOptions.find((option) => option.value === '0');
      if (
        (menuType === 'M' || menuType === 'C') &&
        rootOption &&
        value !== '0'
      ) {
        onChange('0');
        return;
      }
      if (value !== '') {
        onChange('');
      }
    }
  }, [filteredOptions, menuType, onChange, value]);

  const resolvedValue = value && value !== '' ? value : undefined;

  return (
    <Select value={resolvedValue} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full justify-between">
        <SelectValue placeholder={t('parentSelect.placeholder')} />
      </SelectTrigger>
      <SelectContent
        align="start"
        className="max-h-72 w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]"
      >
        <SelectGroup>
          {filteredOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              title={option.fullPath}
            >
              {option.displayLabel}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
