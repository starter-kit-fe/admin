'use client';

import { useAuthStore } from '@/app/login/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  changePassword,
  forceLogoutSelfSession,
  getProfile,
  listSelfSessions,
  updateProfile,
} from '../api';
import {
  type PasswordFormValues,
  type ProfileFormValues,
  passwordFormSchema,
  profileFormSchema,
} from '../schemas';
import { PasswordFormCard } from './PasswordFormCard';
import { ProfileFormCard } from './ProfileFormCard';
import { ProfileSessionsCard } from './ProfileSessionsCard';
import { SecurityOverviewCard } from './SecurityOverviewCard';

const PROFILE_QUERY_KEY = ['profile'];
const PROFILE_SESSIONS_QUERY_KEY = ['profile', 'sessions'];

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfile,
  });

  const sessionQuery = useQuery({
    queryKey: PROFILE_SESSIONS_QUERY_KEY,
    queryFn: listSelfSessions,
  });

  const profile = profileQuery.data;

  const infoForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nickName: '',
      email: '',
      phonenumber: '',
      sex: '2',
      remark: '',
    },
  });

  useEffect(() => {
    if (profile) {
      infoForm.reset({
        nickName: profile.nickName ?? '',
        email: profile.email ?? '',
        phonenumber: profile.phonenumber ?? '',
        sex: (profile.sex as '0' | '1' | '2') ?? '2',
        remark: profile.remark ?? '',
      });
    }
  }, [profile, infoForm]);

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      toast.success('个人资料已更新');
      queryClient.setQueryData(PROFILE_QUERY_KEY, data);
      if (user) {
        setUser({
          ...user,
          nickName: data.nickName,
          email: data.email,
          phonenumber: data.phonenumber,
          sex: data.sex,
          remark: data.remark ?? '',
          avatar: data.avatar ?? user.avatar,
        });
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : '更新个人资料失败，请稍后重试';
      toast.error(message);
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('密码已更新');
      passwordForm.reset();
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : '更新密码失败，请稍后重试';
      toast.error(message);
    },
  });

  const sessionLogoutMutation = useMutation({
    mutationFn: forceLogoutSelfSession,
    onSuccess: () => {
      toast.success('会话已强制下线');
      void sessionQuery.refetch();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : '操作失败，请稍后重试';
      toast.error(message);
    },
  });

  const handleProfileSubmit = infoForm.handleSubmit((values) => {
    updateProfileMutation.mutate({
      nickName: values.nickName.trim(),
      email: values.email?.trim() ?? '',
      phonenumber: values.phonenumber?.trim() ?? '',
      sex: values.sex,
      remark: values.remark?.trim() ?? '',
    });
  });

  const handlePasswordSubmit = passwordForm.handleSubmit((values) => {
    changePasswordMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  });

  const handleForceLogoutSession = (sessionId: string) => {
    if (!sessionId) {
      toast.error('无法识别该会话');
      return;
    }
    setPendingSessionId(sessionId);
    sessionLogoutMutation.mutate(sessionId, {
      onSettled: () => setPendingSessionId(null),
    });
  };

  const sessionItems = sessionQuery.data?.list ?? [];
  const isProfileLoading = profileQuery.isLoading && !profile;
  const isSessionLoading = sessionQuery.isLoading && !sessionQuery.data;
  const isSessionError = sessionQuery.isError;

  const lastLoginAt = formatDateTime(profile?.loginDate ?? null);
  const lastPasswordChange = formatDateTime(profile?.pwdUpdateDate ?? null);
  const lastLoginIp = profile?.loginIp?.trim() || 'IP 信息缺失';

  return (
    <div className="space-y-6 ">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">账号设置</h1>
        <p className="text-sm text-muted-foreground">
          更新个人信息并管理安全配置，随时掌控自己的账号。
        </p>
      </div>
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-full max-w-md justify-start bg-muted-foreground/10">
          <TabsTrigger value="profile">个人信息</TabsTrigger>
          <TabsTrigger value="security">安全性</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-6">
          <ProfileFormCard
            form={infoForm}
            isLoading={isProfileLoading}
            submitting={updateProfileMutation.isPending}
            onSubmit={handleProfileSubmit}
          />
          <ProfileSessionsCard
            isError={isSessionError}
            isLoading={isSessionLoading}
            sessions={sessionItems}
            onRefresh={() => sessionQuery.refetch()}
            isRefreshing={sessionQuery.isFetching}
            onForceLogout={handleForceLogoutSession}
            pendingSessionId={pendingSessionId}
          />
        </TabsContent>
        <TabsContent value="security" className="space-y-6">
          <PasswordFormCard
            form={passwordForm}
            onSubmit={handlePasswordSubmit}
            submitting={changePasswordMutation.isPending}
          />
          <SecurityOverviewCard
            isLoading={isProfileLoading}
            lastLoginAt={lastLoginAt}
            lastLoginIp={lastLoginIp}
            lastPasswordChange={lastPasswordChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '暂无记录';
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}
