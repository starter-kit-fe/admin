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
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { listDeptOptions, listRoleOptions } from '../api';
import type { User, UserFormValues } from '../type';

const userFormSchema = z.object({
  userName: z
    .string()
    .trim()
    .min(2, '至少 2 个字符')
    .max(30, '不超过 30 个字符'),
  nickName: z.string().trim().min(1, '请输入用户昵称'),
  email: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      '邮箱格式不正确',
    ),
  phonenumber: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^1\d{10}$/.test(value),
      '请输入 11 位手机号',
    ),
  sex: z.enum(['0', '1', '2']),
  status: z.enum(['0', '1']),
  deptId: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), '部门需为数字'),
  roleId: z.string().trim().min(1, '请选择角色'),
  remark: z.string().trim(),
  password: z.string().optional(),
});

const DEFAULT_VALUES: UserFormValues = {
  userName: '',
  nickName: '',
  email: '',
  phonenumber: '',
  sex: '2',
  status: '0',
  deptId: '',
  roleId: '',
  remark: '',
  password: '',
};

type UserFormResolverContext = Record<string, never>;

interface OptionItem {
  value: string;
  label: string;
}

function RequiredMark() {
  return <span className="mr-1 text-destructive">*</span>;
}

interface UserEditorDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  defaultValues?: UserFormValues;
  submitting?: boolean;
  editingUser?: User | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UserFormValues) => void;
}

export function UserEditorDialog({
  mode,
  open,
  defaultValues,
  submitting,
  editingUser,
  onOpenChange,
  onSubmit,
}: UserEditorDialogProps) {
  const form = useForm<UserFormValues, UserFormResolverContext, UserFormValues>(
    {
      resolver: zodResolver<
        UserFormValues,
        UserFormResolverContext,
        UserFormValues
      >(userFormSchema),
      defaultValues: defaultValues ?? DEFAULT_VALUES,
    },
  );

  useEffect(() => {
    if (open) {
      form.reset(defaultValues ?? DEFAULT_VALUES);
    }
  }, [open, defaultValues, form]);

  const [deptSearch, setDeptSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const debouncedDeptSearch = useDebouncedValue(deptSearch, 300);
  const debouncedRoleSearch = useDebouncedValue(roleSearch, 300);

  useEffect(() => {
    if (!open) {
      setDeptSearch('');
      setRoleSearch('');
    }
  }, [open]);

  const deptQuery = useQuery({
    queryKey: ['system', 'users', 'dept-options', debouncedDeptSearch],
    queryFn: () => listDeptOptions(debouncedDeptSearch || undefined),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const roleQuery = useQuery({
    queryKey: ['system', 'users', 'role-options', debouncedRoleSearch],
    queryFn: () => listRoleOptions(debouncedRoleSearch || undefined),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const fallbackDeptOption = useMemo<OptionItem | null>(() => {
    if (!editingUser?.deptId || !editingUser?.deptName) {
      return null;
    }
    return { value: String(editingUser.deptId), label: editingUser.deptName };
  }, [editingUser?.deptId, editingUser?.deptName]);

  const fallbackRoleOption = useMemo<OptionItem | null>(() => {
    const primaryRole = editingUser?.roles?.[0];
    if (!primaryRole) {
      return null;
    }
    return {
      value: String(primaryRole.roleId),
      label:
        primaryRole.roleName ||
        primaryRole.roleKey ||
        `角色 ${primaryRole.roleId}`,
    };
  }, [editingUser?.roles]);

  const deptOptions = useMemo<OptionItem[]>(() => {
    const fetched = (deptQuery.data ?? []).map<OptionItem>((dept) => ({
      value: String(dept.deptId),
      label: dept.deptName || `部门 ${dept.deptId}`,
    }));
    if (
      fallbackDeptOption &&
      fallbackDeptOption.value &&
      !fetched.some((item) => item.value === fallbackDeptOption.value)
    ) {
      return [fallbackDeptOption, ...fetched];
    }
    return fetched;
  }, [deptQuery.data, fallbackDeptOption]);

  const roleOptions = useMemo<OptionItem[]>(() => {
    const fetched = (roleQuery.data ?? []).map<OptionItem>((role) => ({
      value: String(role.roleId),
      label: role.roleName || role.roleKey || `角色 ${role.roleId}`,
    }));
    if (
      fallbackRoleOption &&
      fallbackRoleOption.value &&
      !fetched.some((item) => item.value === fallbackRoleOption.value)
    ) {
      return [fallbackRoleOption, ...fetched];
    }
    return fetched;
  }, [roleQuery.data, fallbackRoleOption]);

  const handleSubmit = form.handleSubmit((values: UserFormValues) => {
    const trimmedPassword = values.password?.trim() ?? '';

    if (mode === 'create' && trimmedPassword.length === 0) {
      form.setError('password', {
        type: 'manual',
        message: '请输入登录密码',
      });
      return;
    }

    if (trimmedPassword.length > 0 && trimmedPassword.length < 6) {
      form.setError('password', {
        type: 'manual',
        message: '至少 6 位字符',
      });
      return;
    }

    onSubmit({
      ...values,
      userName: values.userName.trim(),
      nickName: values.nickName.trim(),
      email: values.email.trim(),
      phonenumber: values.phonenumber.trim(),
      deptId: values.deptId.trim(),
      roleId: values.roleId.trim(),
      remark: values.remark?.trim() ?? '',
      password: trimmedPassword,
    });
  });

  const title = mode === 'create' ? '新增用户' : '编辑用户';
  const description =
    mode === 'create'
      ? '创建一个新的系统账号并设置默认密码。'
      : '更新用户的基本信息和状态。';
  const submitText = submitting
    ? '提交中...'
    : mode === 'create'
      ? '创建'
      : '保存';

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Content className="sm:max-w-xl">
        <ResponsiveDialog.Header>
          <ResponsiveDialog.Title>{title}</ResponsiveDialog.Title>
          <ResponsiveDialog.Description>
            {description}
          </ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          <Form {...form}>
            <form className="space-y-4" onSubmit={handleSubmit}>
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
                        <Input
                          placeholder="请输入登录账号"
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
                        <Input
                          placeholder="可选"
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
                      <FormLabel>邮箱</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="可选"
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
                      <FormLabel>归属部门</FormLabel>
                      <FormControl>
                        <SearchableCombobox
                          placeholder="请选择归属部门"
                          value={field.value}
                          options={deptOptions}
                          loading={deptQuery.isFetching}
                          disabled={submitting}
                          onSearch={setDeptSearch}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <RequiredMark /> 角色
                      </FormLabel>
                      <FormControl>
                        <SearchableCombobox
                          placeholder="请选择角色"
                          value={field.value}
                          options={roleOptions}
                          loading={roleQuery.isFetching}
                          disabled={submitting}
                          onSearch={setRoleSearch}
                          onChange={field.onChange}
                          allowClear={false}
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
                        onValueChange={(value: '0' | '1' | '2') =>
                          field.onChange(value)
                        }
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
                {mode === 'create' ? (
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
                ) : null}
              </div>

              <FormField
                control={form.control}
                name="remark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>备注</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[96px] resize-none"
                        placeholder="可选"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ResponsiveDialog.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitText}
                </Button>
              </ResponsiveDialog.Footer>
            </form>
          </Form>
        </div>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delay]);

  return debounced;
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
          className={cn(
            'w-full justify-between',
            !selected && 'text-muted-foreground',
          )}
          disabled={disabled}
        >
          {triggerLabel}
          <ChevronsUpDown className="ml-2 size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
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
            <CommandEmpty>{loading ? '加载中…' : '暂无匹配结果'}</CommandEmpty>
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
                    className={cn(
                      'mr-2 size-4',
                      value === '' ? 'opacity-100' : 'opacity-0',
                    )}
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
