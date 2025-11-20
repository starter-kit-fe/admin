import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

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
  const passwordField =
    mode === 'create' ? (
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel className="flex items-center">
              <RequiredMark /> 初始密码
            </FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder="至少 6 位"
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
                    <RequiredMark /> 登录账号
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="请输入登录账号" autoComplete="username" {...field} />
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
                    <RequiredMark /> 用户昵称
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="请输入用户昵称" {...field} />
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
                  <FormLabel>手机号</FormLabel>
                  <FormControl>
                    <Input placeholder="可选" inputMode="numeric" {...field} />
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
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="可选" autoComplete="email" {...field} />
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
                  <FormLabel>归属部门</FormLabel>
                  <FormControl>
                    <SearchableCombobox
                      placeholder="请选择归属部门"
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
                    <RequiredMark /> 角色
                  </FormLabel>
                  <FormControl>
                    <SearchableMultiSelect
                      placeholder="请选择角色"
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
                  <FormLabel>岗位</FormLabel>
                  <FormControl>
                    <SearchableMultiSelect
                      placeholder="可选"
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
                  <FormLabel>用户性别</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value: '0' | '1' | '2') => field.onChange(value)}
                    disabled={submitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择性别" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">男</SelectItem>
                      <SelectItem value="1">女</SelectItem>
                      <SelectItem value="2">未知</SelectItem>
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
                    <RequiredMark /> 账号状态
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
                        <FormLabel className="font-normal">正常</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="1" />
                        </FormControl>
                        <FormLabel className="font-normal">停用</FormLabel>
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
                <FormLabel>备注</FormLabel>
                <FormControl>
                  <Textarea className="min-h-[96px] resize-none" placeholder="可选" {...field} />
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
            placeholder="搜索选项"
          />
          <CommandList>
            <CommandEmpty>
              <Empty className="border-0 bg-transparent p-2">
                <EmptyHeader>
                  <EmptyTitle>{loading ? '正在加载' : '暂无匹配结果'}</EmptyTitle>
                  <EmptyDescription>
                    {loading ? '请稍候...' : '尝试调整关键字继续搜索。'}
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
                  暂不选择
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
  const displayLabel =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length <= maxPreview
        ? selectedOptions.map((option) => option.label).join('、')
        : `${selectedOptions
            .slice(0, maxPreview)
            .map((option) => option.label)
            .join('、')} 等${selectedOptions.length}项`;

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
            placeholder="搜索选项"
          />
          <CommandList>
            <CommandEmpty>
              <Empty className="border-0 bg-transparent p-2">
                <EmptyHeader>
                  <EmptyTitle>{loading ? '正在加载' : '暂无匹配结果'}</EmptyTitle>
                  <EmptyDescription>
                    {loading ? '请稍候...' : '尝试调整关键字继续搜索。'}
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
                  清空选择
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
