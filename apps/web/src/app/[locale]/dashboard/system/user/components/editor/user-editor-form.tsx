"use client";

import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';

import type { UserFormValues } from '../../type';

export interface OptionItem {
  value: string;
  label: string;
}

interface UserEditorFormProps {
  form: UseFormReturn<UserFormValues>;
  isMobile: boolean;
  mode: 'create' | 'edit';
  submitting?: boolean;
  deptOptions: OptionItem[];
  roleOptions: OptionItem[];
  postOptions: OptionItem[];
  deptLoading?: boolean;
  roleLoading?: boolean;
  postLoading?: boolean;
  onDeptSearch: (value: string) => void;
  onRoleSearch: (value: string) => void;
  onPostSearch: (value: string) => void;
  onCancel: () => void;
  onSubmit: ReturnType<UseFormReturn<UserFormValues>['handleSubmit']>;
}

export function UserEditorForm({
  form,
  isMobile,
  mode,
  submitting,
  deptOptions,
  roleOptions,
  postOptions,
  deptLoading,
  roleLoading,
  postLoading,
  onDeptSearch,
  onRoleSearch,
  onPostSearch,
  onCancel,
  onSubmit,
}: UserEditorFormProps) {
  const tForm = useTranslations('UserManagement.form');
  const tGender = useTranslations('UserManagement.gender');
  const tStatus = useTranslations('UserManagement.status');
  const tCommonDialogs = useTranslations('Common.dialogs');
  const submitText = submitting
    ? tForm('submit.creating')
    : mode === 'create'
      ? tForm('submit.create')
      : tForm('submit.save');
  const cancelButtonClasses = cn(isMobile && 'flex-1 basis-2/5');
  const submitButtonClasses = cn(isMobile && 'flex-1 basis-3/5');

  const passwordField =
    mode === 'create' ? (
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel className="flex items-center">
              <RequiredMark /> {tForm('initialPassword')}
            </FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder={tForm('initialPasswordPlaceholder')}
                autoComplete="new-password"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ) : null;

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <RequiredMark /> {tForm('account')}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={tForm('accountPlaceholder')}
                    autoComplete="username"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nickName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <RequiredMark /> {tForm('nickname')}
                </FormLabel>
                <FormControl>
                  <Input placeholder={tForm('nicknamePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phonenumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tForm('phone')}</FormLabel>
                <FormControl>
                  <Input placeholder={tForm('phonePlaceholder')} inputMode="numeric" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tForm('email')}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={tForm('emailPlaceholder')}
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deptId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tForm('dept')}</FormLabel>
                <FormControl>
                  <SearchableCombobox
                    placeholder={tForm('deptPlaceholder')}
                    value={field.value}
                    options={deptOptions}
                    loading={deptLoading}
                    disabled={submitting}
                    onSearch={onDeptSearch}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="roleIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <RequiredMark /> {tForm('roles')}
                </FormLabel>
                <FormControl>
                  <SearchableMultiSelect
                    placeholder={tForm('rolesPlaceholder')}
                    value={field.value}
                    options={roleOptions}
                    loading={roleLoading}
                    disabled={submitting}
                    onSearch={onRoleSearch}
                    onChange={field.onChange}
                    allowClear
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="postIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tForm('posts')}</FormLabel>
                <FormControl>
                  <SearchableMultiSelect
                    placeholder={tForm('postsPlaceholder')}
                    value={field.value}
                    options={postOptions}
                    loading={postLoading}
                    disabled={submitting}
                    onSearch={onPostSearch}
                    onChange={field.onChange}
                    allowClear
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tForm('sex')}</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value: '0' | '1' | '2') => field.onChange(value)}
                  disabled={submitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={tForm('sexPlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">{tGender('male')}</SelectItem>
                    <SelectItem value="1">{tGender('female')}</SelectItem>
                    <SelectItem value="2">{tGender('unknown')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <RequiredMark /> {tForm('status')}
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    className="flex flex-wrap gap-4"
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={submitting}
                  >
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="0" />
                      </FormControl>
                      <FormLabel className="font-normal">{tStatus('enabled')}</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="1" />
                      </FormControl>
                      <FormLabel className="font-normal">{tStatus('disabled')}</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {passwordField}
        </div>

        <FormField
          control={form.control}
          name="remark"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tForm('description')}</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-[96px] resize-none"
                  placeholder={tForm('optional')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ResponsiveDialog.Footer
          className={cn(
            'flex flex-col gap-2 sm:flex-row sm:justify-end',
            isMobile &&
              'sticky bottom-0 left-0 right-0 w-full rounded-none border-t border-border/60 bg-card/95 px-4 py-3 backdrop-blur sm:static sm:border-none sm:bg-transparent sm:px-0 sm:py-0',
          )}
        >
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className={cancelButtonClasses}
          >
            {tCommonDialogs('cancel')}
          </Button>
          <Button type="submit" disabled={submitting} className={submitButtonClasses}>
            {submitText}
          </Button>
        </ResponsiveDialog.Footer>
      </form>
    </Form>
  );
}

function RequiredMark() {
  return <span className="mr-1 text-destructive">*</span>;
}

interface SearchableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  placeholder: string;
  options: OptionItem[];
  loading?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
}

function SearchableCombobox({
  value,
  onChange,
  onSearch,
  placeholder,
  options,
  loading,
  disabled,
  allowClear = true,
}: SearchableComboboxProps) {
  const tForm = useTranslations('UserManagement.form');
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!open) {
      setInputValue('');
      onSearch('');
    }
  }, [open, onSearch]);

  const selected = options.find((option) => option.value === value);
  const triggerLabel = selected?.label ?? placeholder;

  return (
    <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', !selected && 'text-muted-foreground')}
          disabled={disabled}
        >
          {triggerLabel}
          <ChevronsUpDown className="ml-2 size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            value={inputValue}
            onValueChange={(next) => {
              setInputValue(next);
              onSearch(next);
            }}
            placeholder={tForm('searchPlaceholder')}
          />
          <CommandList>
            <CommandEmpty>
              <Empty className="border-0 bg-transparent p-2">
                <EmptyHeader>
                  <EmptyTitle>
                    {loading ? tForm('searchLoadingTitle') : tForm('searchEmptyTitle')}
                  </EmptyTitle>
                  <EmptyDescription>
                    {loading
                      ? tForm('searchLoadingDescription')
                      : tForm('searchEmptyDescription')}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CommandEmpty>
            <CommandGroup>
              {allowClear ? (
                <CommandItem
                  key="__clear__"
                  value="__clear__"
                  onSelect={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 size-4', value === '' ? 'opacity-100' : 'opacity-0')}
                  />
                  {tForm('searchNone')}
                </CommandItem>
              ) : null}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(current) => {
                    onChange(current);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      value === option.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface SearchableMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  onSearch: (value: string) => void;
  placeholder: string;
  options: OptionItem[];
  loading?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  maxPreview?: number;
}

function SearchableMultiSelect({
  value,
  onChange,
  onSearch,
  placeholder,
  options,
  loading,
  disabled,
  allowClear = true,
  maxPreview = 2,
}: SearchableMultiSelectProps) {
  const tForm = useTranslations('UserManagement.form');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const normalizedValue = Array.isArray(value) ? value : [];

  useEffect(() => {
    if (!open) {
      setInputValue('');
      onSearch('');
    }
  }, [open, onSearch]);

  const selectedOptions = options.filter((option) => normalizedValue.includes(option.value));
  const separator = locale.startsWith('zh') ? '、' : ', ';
  const previewText = selectedOptions
    .slice(0, maxPreview)
    .map((option) => option.label)
    .join(separator);
  const displayLabel =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length <= maxPreview
        ? previewText
        : tForm('multiSelectPreview', {
            preview: previewText,
            count: selectedOptions.length,
          });

  const toggleValue = (itemValue: string) => {
    const set = new Set(normalizedValue);
    if (set.has(itemValue)) {
      set.delete(itemValue);
    } else {
      set.add(itemValue);
    }
    onChange(Array.from(set));
  };

  return (
    <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between',
            selectedOptions.length === 0 && 'text-muted-foreground',
          )}
          disabled={disabled}
        >
          {displayLabel}
          <ChevronsUpDown className="ml-2 size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            value={inputValue}
            onValueChange={(next) => {
              setInputValue(next);
              onSearch(next);
            }}
            placeholder={tForm('searchPlaceholder')}
          />
          <CommandList>
            <CommandEmpty>
              <Empty className="border-0 bg-transparent p-2">
                <EmptyHeader>
                  <EmptyTitle>
                    {loading ? tForm('searchLoadingTitle') : tForm('searchEmptyTitle')}
                  </EmptyTitle>
                  <EmptyDescription>
                    {loading
                      ? tForm('searchLoadingDescription')
                      : tForm('searchEmptyDescription')}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CommandEmpty>
            <CommandGroup>
              {allowClear ? (
                <CommandItem
                  key="__clear__"
                  value="__clear__"
                  onSelect={() => {
                    onChange([]);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      normalizedValue.length === 0 ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {tForm('searchClear')}
                </CommandItem>
              ) : null}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    toggleValue(option.value);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      normalizedValue.includes(option.value) ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
