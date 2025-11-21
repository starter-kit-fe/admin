import { FormDialogLayout } from '@/components/dialogs/form-dialog-layout';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTranslations } from 'next-intl';

import { listDeptOptions, listPostOptions, listRoleOptions } from '../../api';
import type { DeptOption, User, UserFormValues } from '../../type';
import { type OptionItem, UserEditorForm } from '../editor/user-editor-form';

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
  const t = useTranslations('UserManagement');
  const userFormSchema = useMemo(
    () =>
      z.object({
        userName: z
          .string()
          .trim()
          .min(2, t('form.validation.account.min'))
          .max(30, t('form.validation.account.max')),
        nickName: z
          .string()
          .trim()
          .min(1, t('form.validation.nickname.required')),
        email: z
          .string()
          .trim()
          .refine(
            (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            t('form.validation.email.invalid'),
          ),
        phonenumber: z
          .string()
          .trim()
          .refine(
            (value) => value === '' || /^1\d{10}$/.test(value),
            t('form.validation.phone.invalid'),
          ),
        sex: z.enum(['0', '1', '2']),
        status: z.enum(['0', '1']),
        deptId: z
          .string()
          .trim()
          .refine(
            (value) => value === '' || /^\d+$/.test(value),
            t('form.validation.dept.numeric'),
          ),
        roleIds: z
          .array(z.string().trim().min(1, t('form.validation.role.invalid')))
          .min(1, t('form.validation.role.required')),
        postIds: z.array(
          z.string().trim().min(1, t('form.validation.post.invalid')),
        ),
        remark: z.string().trim(),
        password: z.string(),
      }),
    [t],
  );
  const form = useForm<UserFormValues, UserFormResolverContext>({
    resolver: zodResolver(userFormSchema),
    defaultValues: defaultValues ?? DEFAULT_VALUES,
  });

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

  const fallbackDeptOption = buildFallbackDeptOption(editingUser, t('form.dept'));
  const fallbackRoleOptions = buildFallbackRoleOptions(
    editingUser,
    t('form.roles'),
  );
  const fallbackPostOptions = buildFallbackPostOptions(
    editingUser,
    t('form.posts'),
  );

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
      label:
        role.roleName || role.roleKey || `${t('form.roles')} ${role.roleId}`,
    }));
    if (fetched.length > 0) {
      setRoleOptionCache((prev) => mergeOptionLists(prev, fetched));
    }
  }, [open, roleQuery.data, t]);

  useEffect(() => {
    if (!open || !postQuery.data) {
      return;
    }
    const fetched = postQuery.data.map<OptionItem>((post) => ({
      value: String(post.postId),
      label:
        post.postName || post.postCode || `${t('form.posts')} ${post.postId}`,
    }));
    if (fetched.length > 0) {
      setPostOptionCache((prev) => mergeOptionLists(prev, fetched));
    }
  }, [open, postQuery.data, t]);

  const deptOptions = buildDeptOptions(
    deptQuery.data,
    fallbackDeptOption,
    t('form.dept'),
  );

  const roleOptions = roleOptionCache;
  const postOptions = postOptionCache;

  const handleSubmit = form.handleSubmit((values: UserFormValues) => {
    const trimmedPassword = values.password?.trim() ?? '';

    if (mode === 'create' && trimmedPassword.length === 0) {
      form.setError('password', {
        type: 'manual',
        message: t('form.validation.password.required'),
      });
      return;
    }

    if (trimmedPassword.length > 0 && trimmedPassword.length < 6) {
      form.setError('password', {
        type: 'manual',
        message: t('form.validation.password.min'),
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

  const title =
    mode === 'create' ? t('dialogs.createTitle') : t('dialogs.editTitle');
  const description =
    mode === 'create'
      ? t('dialogs.createDescription')
      : t('dialogs.editDescription');
  const formId = 'user-editor-form';

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <FormDialogLayout
        title={title}
        description={description}
        contentClassName="sm:max-w-xl"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="flex-1 sm:flex-none sm:min-w-[96px]"
              >
                {t('dialogs.bulkDeleteCancel')}
              </Button>
              <Button
                type="submit"
                form={formId}
                disabled={submitting}
                className="flex-[1.5] sm:flex-none sm:min-w-[96px]"
              >
                {submitting
                  ? t('form.submit.creating')
                  : mode === 'create'
                    ? t('form.submit.create')
                    : t('form.submit.save')}
              </Button>
            </>
          }
        >
        <UserEditorForm
          className="flex-1 min-h-0"
          formId={formId}
          form={form}
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
          onSubmit={handleSubmit}
        />
      </FormDialogLayout>
    </ResponsiveDialog>
  );
}

function buildFallbackDeptOption(
  user?: User | null,
  fallbackLabel?: string,
): OptionItem | null {
  if (!user?.deptId || !user?.deptName) {
    return null;
  }
  return {
    value: String(user.deptId),
    label: user.deptName || `${fallbackLabel ?? 'Dept'} ${user.deptId}`,
  };
}

function buildFallbackRoleOptions(
  user?: User | null,
  fallbackLabel?: string,
): OptionItem[] {
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
      label:
        role.roleName ||
        role.roleKey ||
        `${fallbackLabel ?? 'Role'} ${role.roleId}`,
    });
  });
  return items;
}

function buildFallbackPostOptions(
  user?: User | null,
  fallbackLabel?: string,
): OptionItem[] {
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
      label:
        post.postName ||
        post.postCode ||
        `${fallbackLabel ?? 'Post'} ${post.postId}`,
    });
  });
  return items;
}

function buildDeptOptions(
  data: DeptOption[] | undefined,
  fallback: OptionItem | null,
  fallbackLabel?: string,
): OptionItem[] {
  const fetched = (data ?? []).map<OptionItem>((dept) => ({
    value: String(dept.deptId),
    label: dept.deptName || `${fallbackLabel ?? 'Dept'} ${dept.deptId}`,
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
