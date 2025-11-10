import type { User, UserFormValues } from '../type';

export const STATUS_META = {
  all: { label: '全部', tone: 'default', badgeClass: 'bg-slate-900 text-white' },
  '0': { label: '启用', tone: 'success', badgeClass: 'bg-emerald-100 text-emerald-700' },
  '1': { label: '停用', tone: 'danger', badgeClass: 'bg-rose-100 text-rose-700' },
} as const;

export type StatusKey = keyof typeof STATUS_META | 'all';

export const DEFAULT_ROLE_VALUE = 'all';

export const getDisplayName = (user: User) => {
  const base = user.nickName?.trim() || user.userName?.trim();
  return base && base.length > 0 ? base : '用户';
};

export const getAccountLabel = (user: User, fallback = '—') => {
  const base = user.userName?.trim();
  return base && base.length > 0 ? base : fallback;
};

export const getAvatarFallback = (user: User) => {
  const name = getDisplayName(user);
  return name.slice(0, 1).toUpperCase();
};

export const formatPhoneNumber = (value?: string | null) => {
  if (!value) {
    return '—';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '—';
  }
  return trimmed;
};

export const getCompanyLabel = (user: User) => {
  return user.deptName?.trim() || '—';
};

export const getRoleLabel = (user: User) => {
  const primaryRole = user.roles?.[0];
  if (primaryRole?.roleName?.trim()) {
    return primaryRole.roleName.trim();
  }
  if (user.userType?.trim()) {
    return user.userType.trim();
  }
  return '成员';
};

export const getEmailLabel = (user: User) => {
  return user.email?.trim() || user.userName;
};

export const toFormValues = (user: User): UserFormValues => ({
  userName: user.userName ?? '',
  nickName: user.nickName ?? '',
  email: user.email ?? '',
  phonenumber: user.phonenumber ?? '',
  sex: (user.sex as '0' | '1' | '2') ?? '2',
  status: (user.status as '0' | '1') ?? '0',
  deptId: user.deptId ? String(user.deptId) : '',
  remark: user.remark ?? '',
  password: '',
  roleIds: Array.isArray(user.roles)
    ? user.roles
        .filter((role) => role.roleId != null)
        .map((role) => String(role.roleId))
    : [],
  postIds: Array.isArray(user.posts)
    ? user.posts
        .filter((post) => post.postId != null)
        .map((post) => String(post.postId))
    : [],
});

export const sanitizeDeptId = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
};

export const sanitizeIdList = (values: string[]) => {
  if (!Array.isArray(values)) {
    return [];
  }
  const result: number[] = [];
  const seen = new Set<number>();
  values.forEach((value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    const parsed = Number.parseInt(trimmed, 10);
    if (Number.isNaN(parsed) || seen.has(parsed)) {
      return;
    }
    seen.add(parsed);
    result.push(parsed);
  });
  return result;
};
