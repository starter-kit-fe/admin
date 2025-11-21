import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

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
  onSubmit: ReturnType<UseFormReturn<UserFormValues>['handleSubmit']>;
  className?: string;
  formId?: string;
}

export function UserEditorForm({
  form,
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
  onSubmit,
  className,
  formId,
}: UserEditorFormProps) {
  const t = useTranslations('UserManagement');
  const searchCopy = {
    searchPlaceholder: t('form.searchPlaceholder'),
    loadingTitle: t('form.searchLoadingTitle'),
    loadingDescription: t('form.searchLoadingDescription'),
    emptyTitle: t('form.searchEmptyTitle'),
    emptyDescription: t('form.searchEmptyDescription'),
    noneLabel: t('form.searchNone'),
    clearLabel: t('form.searchClear'),
  };
  const multiSelectCopy = {
    ...searchCopy,
    formatPreview: (preview: string, count: number) =>
      t('form.multiSelectPreview', { preview, count }),
  };
  const optionalLabel = t('form.optional');
  const genderLabels = {
    '0': t('gender.male'),
    '1': t('gender.female'),
    '2': t('gender.unknown'),
  } as const;
  const statusLabels = {
    '0': t('status.enabled'),
    '1': t('status.disabled'),
  } as const;

  const passwordField =
    mode === 'create' ? (
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel className="flex items-center">
              <RequiredMark /> {t('form.initialPassword')}
            </FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder={t('form.initialPasswordPlaceholder')}
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
      <form
        className={cn('flex h-full min-h-0 flex-col', className)}
        onSubmit={onSubmit}
        id={formId}
      >
        <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pr-1 sm:pr-0">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <RequiredMark /> {t('form.account')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('form.accountPlaceholder')}
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
                    <RequiredMark /> {t('form.nickname')}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('form.nicknamePlaceholder')} {...field} />
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
                  <FormLabel>{t('form.phone')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('form.phonePlaceholder') || optionalLabel}
                      inputMode="numeric"
                      {...field}
                    />
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
                  <FormLabel>{t('form.email')}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t('form.emailPlaceholder') || optionalLabel}
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
                  <FormLabel>{t('form.dept')}</FormLabel>
                  <FormControl>
                    <SearchableCombobox
                      placeholder={t('form.deptPlaceholder')}
                      value={field.value}
                      options={deptOptions}
                      loading={deptLoading}
                      disabled={submitting}
                      onSearch={onDeptSearch}
                      onChange={field.onChange}
                      copy={searchCopy}
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
                    <RequiredMark /> {t('form.roles')}
                  </FormLabel>
                  <FormControl>
                    <SearchableMultiSelect
                      placeholder={t('form.rolesPlaceholder')}
                      value={field.value}
                      options={roleOptions}
                      loading={roleLoading}
                      disabled={submitting}
                      onSearch={onRoleSearch}
                      onChange={field.onChange}
                      allowClear
                      copy={multiSelectCopy}
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
                  <FormLabel>{t('form.posts')}</FormLabel>
                  <FormControl>
                    <SearchableMultiSelect
                      placeholder={t('form.postsPlaceholder') || optionalLabel}
                      value={field.value}
                      options={postOptions}
                      loading={postLoading}
                      disabled={submitting}
                      onSearch={onPostSearch}
                      onChange={field.onChange}
                      allowClear
                      copy={multiSelectCopy}
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
                  <FormLabel>{t('form.sex')}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value: '0' | '1' | '2') => field.onChange(value)}
                    disabled={submitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('form.sexPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">{genderLabels['0']}</SelectItem>
                      <SelectItem value="1">{genderLabels['1']}</SelectItem>
                      <SelectItem value="2">{genderLabels['2']}</SelectItem>
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
                    <RequiredMark /> {t('form.status')}
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
                        <FormLabel className="font-normal">
                          {statusLabels['0']}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="1" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {statusLabels['1']}
                        </FormLabel>
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
                <FormLabel>{t('form.description')}</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-[96px] resize-none"
                    placeholder={optionalLabel}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

       
      </form>
    </Form>
  );
}

function RequiredMark() {
  return <span className="mr-1 text-destructive">*</span>;
}

type SearchCopy = {
  searchPlaceholder: string;
  loadingTitle: string;
  loadingDescription: string;
  emptyTitle: string;
  emptyDescription: string;
  noneLabel: string;
  clearLabel: string;
  formatPreview?: (preview: string, count: number) => string;
};

interface SearchableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  placeholder: string;
  options: OptionItem[];
  loading?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  copy: SearchCopy;
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
  copy,
}: SearchableComboboxProps) {
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
            placeholder={copy.searchPlaceholder}
          />
          <CommandList>
            <CommandEmpty>
              <Empty className="border-0 bg-transparent p-2">
                <EmptyHeader>
                  <EmptyTitle>
                    {loading ? copy.loadingTitle : copy.emptyTitle}
                  </EmptyTitle>
                  <EmptyDescription>
                    {loading
                      ? copy.loadingDescription
                      : copy.emptyDescription}
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
                  {copy.noneLabel}
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
  copy: SearchCopy;
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
  copy,
}: SearchableMultiSelectProps) {
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
  const preview = selectedOptions
    .slice(0, maxPreview)
    .map((option) => option.label)
    .join('、');
  const extraCount = Math.max(selectedOptions.length - maxPreview, 0);
  const displayLabel =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length <= maxPreview
        ? preview
        : copy.formatPreview
          ? copy.formatPreview(preview, extraCount)
          : `${preview} +${extraCount}`;

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
            placeholder={copy.searchPlaceholder}
          />
          <CommandList>
            <CommandEmpty>
              <Empty className="border-0 bg-transparent p-2">
                <EmptyHeader>
                  <EmptyTitle>
                    {loading ? copy.loadingTitle : copy.emptyTitle}
                  </EmptyTitle>
                  <EmptyDescription>
                    {loading
                      ? copy.loadingDescription
                      : copy.emptyDescription}
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
                  {copy.clearLabel}
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
