import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { listDeptOptions, listPostOptions, listRoleOptions } from '../../api';
import type { DeptOption, User, UserFormValues } from '../../type';
import { UserEditorForm, type OptionItem } from '../editor/user-editor-form';

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
  roleIds: z
    .array(z.string().trim().min(1, '无效的角色'))
    .min(1, '请选择至少一个角色'),
  postIds: z.array(z.string().trim().min(1, '无效的岗位')).default([]),
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
  roleIds: [],
  postIds: [],
  remark: '',
  password: '',
};

type UserFormResolverContext = Record<string, never>;

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
  const isMobile = useMediaQuery('(max-width: 768px)');
  const form = useForm<UserFormValues, UserFormResolverContext, UserFormValues>(
    {
      resolver: zodResolver(userFormSchema),
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
  const [postSearch, setPostSearch] = useState('');
  const [roleOptionCache, setRoleOptionCache] = useState<OptionItem[]>([]);
  const [postOptionCache, setPostOptionCache] = useState<OptionItem[]>([]);
  const debouncedDeptSearch = useDebouncedValue(deptSearch, 300);
  const debouncedRoleSearch = useDebouncedValue(roleSearch, 300);
  const debouncedPostSearch = useDebouncedValue(postSearch, 300);

  const fallbackDeptOption = buildFallbackDeptOption(editingUser);
  const fallbackRoleOptions = buildFallbackRoleOptions(editingUser);
  const fallbackPostOptions = buildFallbackPostOptions(editingUser);

  useEffect(() => {
    if (!open) {
      setDeptSearch('');
      setRoleSearch('');
      setPostSearch('');
      setRoleOptionCache([]);
      setPostOptionCache([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (fallbackRoleOptions.length > 0) {
      setRoleOptionCache((prev) => mergeOptionLists(prev, fallbackRoleOptions));
    }
    if (fallbackPostOptions.length > 0) {
      setPostOptionCache((prev) => mergeOptionLists(prev, fallbackPostOptions));
    }
  }, [open, fallbackRoleOptions, fallbackPostOptions]);

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

  const postQuery = useQuery({
    queryKey: ['system', 'users', 'post-options', debouncedPostSearch],
    queryFn: () => listPostOptions(debouncedPostSearch || undefined),
    enabled: open,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!open || !roleQuery.data) {
      return;
    }
    const fetched = roleQuery.data.map<OptionItem>((role) => ({
      value: String(role.roleId),
      label: role.roleName || role.roleKey || `角色 ${role.roleId}`,
    }));
    if (fetched.length > 0) {
      setRoleOptionCache((prev) => mergeOptionLists(prev, fetched));
    }
  }, [open, roleQuery.data]);

  useEffect(() => {
    if (!open || !postQuery.data) {
      return;
    }
    const fetched = postQuery.data.map<OptionItem>((post) => ({
      value: String(post.postId),
      label: post.postName || post.postCode || `岗位 ${post.postId}`,
    }));
    if (fetched.length > 0) {
      setPostOptionCache((prev) => mergeOptionLists(prev, fetched));
    }
  }, [open, postQuery.data]);

  const deptOptions = buildDeptOptions(deptQuery.data, fallbackDeptOption);

  const roleOptions = roleOptionCache;
  const postOptions = postOptionCache;

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
      remark: values.remark?.trim() ?? '',
      password: trimmedPassword,
    });
  });

  const title = mode === 'create' ? '新增用户' : '编辑用户';
  const description =
    mode === 'create'
      ? '创建一个新的系统账号并设置默认密码。'
      : '更新用户的基本信息和状态。';

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Content className="sm:max-w-xl">
        <ResponsiveDialog.Header className={cn(isMobile && '!text-left')}>
          <ResponsiveDialog.Title>{title}</ResponsiveDialog.Title>
          <ResponsiveDialog.Description>
            {description}
          </ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <div
          className={cn(
            'max-h-[70vh] space-y-5 overflow-y-auto pr-1',
            isMobile && 'max-h-none space-y-4 overflow-y-visible pr-0',
          )}
        >
          <UserEditorForm
            form={form}
            isMobile={isMobile}
            mode={mode}
            submitting={submitting}
            deptOptions={deptOptions}
            roleOptions={roleOptions}
            postOptions={postOptions}
            deptLoading={deptQuery.isFetching}
            roleLoading={roleQuery.isFetching}
            postLoading={postQuery.isFetching}
            onDeptSearch={setDeptSearch}
            onRoleSearch={setRoleSearch}
            onPostSearch={setPostSearch}
            onCancel={() => onOpenChange(false)}
            onSubmit={handleSubmit}
          />
        </div>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}

function buildFallbackDeptOption(user?: User | null): OptionItem | null {
  if (!user?.deptId || !user?.deptName) {
    return null;
  }
  return { value: String(user.deptId), label: user.deptName };
}

function buildFallbackRoleOptions(user?: User | null): OptionItem[] {
  if (!Array.isArray(user?.roles) || user.roles.length === 0) {
    return [];
  }
  const seen = new Set<string>();
  const items: OptionItem[] = [];
  user.roles.forEach((role) => {
    if (role.roleId == null) {
      return;
    }
    const value = String(role.roleId);
    if (seen.has(value)) {
      return;
    }
    seen.add(value);
    items.push({
      value,
      label: role.roleName || role.roleKey || `角色 ${role.roleId}`,
    });
  });
  return items;
}

function buildFallbackPostOptions(user?: User | null): OptionItem[] {
  if (!Array.isArray(user?.posts) || user.posts.length === 0) {
    return [];
  }
  const seen = new Set<string>();
  const items: OptionItem[] = [];
  user.posts.forEach((post) => {
    if (post.postId == null) {
      return;
    }
    const value = String(post.postId);
    if (seen.has(value)) {
      return;
    }
    seen.add(value);
    items.push({
      value,
      label: post.postName || post.postCode || `岗位 ${post.postId}`,
    });
  });
  return items;
}

function buildDeptOptions(
  data: DeptOption[] | undefined,
  fallback: OptionItem | null,
): OptionItem[] {
  const fetched = (data ?? []).map<OptionItem>((dept) => ({
    value: String(dept.deptId),
    label: dept.deptName || `部门 ${dept.deptId}`,
  }));
  if (
    fallback &&
    fallback.value &&
    !fetched.some((item) => item.value === fallback.value)
  ) {
    return [fallback, ...fetched];
  }
  return fetched;
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

function mergeOptionLists(base: OptionItem[], incoming: OptionItem[]) {
  if (incoming.length === 0) {
    return base;
  }
  const map = new Map(base.map((item) => [item.value, item]));
  let changed = false;
  incoming.forEach((item) => {
    const existing = map.get(item.value);
    if (!existing || existing.label !== item.label) {
      map.set(item.value, item);
      changed = true;
    }
  });
  if (!changed) {
    return base;
  }
  return Array.from(map.values());
}
