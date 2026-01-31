'use client';

import { useAuthStore } from '@/app/login/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
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
  const t = useTranslations('Profile');
  const locale = useLocale();
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
      toast.success(t('toast.profileUpdated'));
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
        error instanceof Error ? error.message : t('toast.profileUpdateError');
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
      toast.success(t('toast.passwordUpdated'));
      passwordForm.reset();
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t('toast.passwordUpdateError');
      toast.error(message);
    },
  });

  const sessionLogoutMutation = useMutation({
    mutationFn: forceLogoutSelfSession,
    onSuccess: () => {
      toast.success(t('toast.sessionLoggedOut'));
      void sessionQuery.refetch();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t('toast.sessionError');
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
      toast.error(t('toast.sessionIdMissing'));
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

  const unknownDateLabel = t('Page.fallback.unknownDate');
  const lastLoginAt = formatDateTime(
    profile?.loginDate ?? null,
    locale,
    unknownDateLabel,
  );
  const lastPasswordChange = formatDateTime(
    profile?.pwdUpdateDate ?? null,
    locale,
    unknownDateLabel,
  );
  const lastLoginIp = profile?.loginIp?.trim() || t('Page.fallback.missingIp');

  return (
    <div className="space-y-6 ">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('Page.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('Page.description')}
        </p>
      </div>
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-full max-w-md justify-start bg-muted-foreground/10">
          <TabsTrigger value="profile">{t('Page.tabs.profile')}</TabsTrigger>
          <TabsTrigger value="security">{t('Page.tabs.security')}</TabsTrigger>
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

function formatDateTime(
  value: string | null | undefined,
  locale: string,
  fallback: string,
) {
  if (!value) {
    return fallback;
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}
