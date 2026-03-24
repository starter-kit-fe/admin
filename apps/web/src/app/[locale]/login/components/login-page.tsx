'use client';

import { LogoMark } from '@/components/logo-mark';
import ThemeToggle from '@/components/theme-toggle';
import { useAuthStore } from '@/stores';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import pkg from '../../../../../package.json';
import { getCaptcha, login } from '../api';
import { type LoginValues, loginSchema } from '../schema';
import type { LoginRequestPayload } from '../type';
import { LoginAside } from './login-aside';
import { LoginForm } from './login-form';

const loginImages = [
  'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80',
];

export function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isCaptchaExpired, setCaptchaExpired] = useState(false);
  const [captchaCountdown, setCaptchaCountdown] = useState<number | null>(null);
  const [loginImage, setLoginImage] = useState<string>(loginImages[0]);
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    resetField,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '', captcha: '' },
  });

  const {
    data: captchaData,
    isFetching: captchaFetching,
    isError: captchaError,
    refetch: refetchCaptcha,
  } = useQuery({
    queryKey: ['auth', 'captcha'],
    queryFn: getCaptcha,
    staleTime: 0,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (values: LoginValues) => {
      const payload: LoginRequestPayload = {
        username: values.username,
        password: values.password,
        captcha: values.captcha,
        captcha_id: captchaData?.captcha_id,
      };
      return login(payload);
    },
    onSuccess: () => {
      toast.success('登录成功，欢迎回来！');
      router.replace('/dashboard');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : '登录失败，请检查账号信息';
      toast.error(message);
      handleRefreshCaptcha();
    },
  });

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    if (!captchaData?.captcha_id || !captchaData?.expires_in) return;
    const duration = Math.max(5, Math.floor(captchaData.expires_in));
    setCaptchaExpired(false);
    setCaptchaCountdown(duration);

    const interval = window.setInterval(() => {
      setCaptchaCountdown((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          window.clearInterval(interval);
          setCaptchaExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [captchaData?.captcha_id, captchaData?.expires_in]);

  useEffect(() => {
    if (loginImages.length <= 1) return;
    const index = Math.floor(Math.random() * loginImages.length);
    setLoginImage(loginImages[index] ?? loginImages[0]);
  }, []);

  const handleRefreshCaptcha = () => {
    resetField('captcha');
    setCaptchaExpired(false);
    setCaptchaCountdown(null);
    void refetchCaptcha();
  };

  const loginTitle = useMemo(() => {
    const title = pkg.seo?.title ?? 'Admin Template';
    return title.split('—')[0]?.trim() ?? title;
  }, []);

  const countdownLabel =
    captchaCountdown !== null
      ? captchaCountdown > 0
        ? `${captchaCountdown}s 后过期`
        : '验证码已过期'
      : null;

  const handleLoginSubmit = handleSubmit((values) =>
    loginMutation.mutate(values),
  );

  return (
    <div className="relative flex min-h-dvh flex-col md:flex-row">
      {/* Mobile: full-screen background image — sharp, no blur */}
      <div className="fixed inset-0 md:hidden">
        <img
          src={loginImage}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/60" />
      </div>

      {/* Theme toggle */}
      <div className="fixed right-4 top-4 z-30 md:right-6 md:top-6">
        <ThemeToggle />
      </div>

      {/* Left aside — desktop only */}
      <LoginAside image={loginImage} title={loginTitle} />

      {/* Right: form panel */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-14 md:bg-background md:px-12 md:py-12">
        {/* Logo — mobile only, above the card */}
        <Link
          href="/"
          aria-label="返回首页"
          className="mb-6 text-white md:hidden"
        >
          <LogoMark className="size-9" />
        </Link>

        {/* Form card: glass on mobile, plain on desktop */}
        <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-background/88 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 md:overflow-visible md:rounded-none md:bg-transparent md:shadow-none md:ring-0 md:[backdrop-filter:none]">
          <LoginForm
            register={register}
            errors={errors}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((prev) => !prev)}
            onSubmit={handleLoginSubmit}
            loginPending={loginMutation.isPending}
            captchaImage={captchaData?.image}
            captchaFetching={captchaFetching}
            captchaError={captchaError}
            countdownLabel={countdownLabel}
            onRefreshCaptcha={handleRefreshCaptcha}
            isCaptchaExpired={isCaptchaExpired}
          />
        </div>
      </main>
    </div>
  );
}
