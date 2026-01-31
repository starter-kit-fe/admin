'use client';

import { LogoMark } from '@/components/logo-mark';
import ThemeToggle from '@/components/theme-toggle';
import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/stores';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import pkg from '../../../../package.json';
import { getCaptcha, login } from './api';
import { LoginAside } from './components/login-aside';
import { LoginForm } from './components/login-form';
import { type LoginValues, loginSchema } from './schema';
import type { LoginRequestPayload } from './type';

const loginImages = [
  'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80',
];

export default function Page() {
  const router = useRouter();
  const t = useTranslations('Login');
  const locale = useLocale();
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
      toast.success(t('toast.success'));
      router.replace(`/${locale}/dashboard`);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t('toast.error');
      toast.error(message);
      handleRefreshCaptcha();
    },
  });

  useEffect(() => {
    if (user) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [user, router, locale]);

  useEffect(() => {
    if (!captchaData?.captcha_id || !captchaData?.expires_in) {
      return;
    }
    const duration = Math.max(5, Math.floor(captchaData.expires_in));
    setCaptchaExpired(false);
    setCaptchaCountdown(duration);

    const interval = window.setInterval(() => {
      setCaptchaCountdown((prev) => {
        if (prev === null) {
          return prev;
        }
        if (prev <= 1) {
          window.clearInterval(interval);
          setCaptchaExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [captchaData?.captcha_id, captchaData?.expires_in]);

  useEffect(() => {
    if (loginImages.length <= 1) {
      return;
    }
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
    const siteName = title.split('—')[0]?.trim() ?? title;
    return t('Page.title', { siteName });
  }, [t]);

  const countdownLabel =
    captchaCountdown !== null
      ? captchaCountdown > 0
        ? t('Page.countdown', { seconds: captchaCountdown })
        : t('Page.countdownExpired')
      : null;

  const description = t('Page.description');

  const featureHighlights = useMemo(
    () => [
      t('Page.highlights.first'),
      t('Page.highlights.second'),
      t('Page.highlights.third'),
    ],
    [t],
  );

  const handleLoginSubmit = handleSubmit((values) =>
    loginMutation.mutate(values),
  );

  return (
    <div className="relative flex min-h-dvh flex-col overflow-y-auto bg-border/40 transition-colors md:flex-row md:overflow-hidden">
      <div className="absolute inset-0 md:hidden">
        <img
          src={loginImage}
          alt={t('Page.backgroundAlt')}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/85" />
      </div>

      <div className="absolute  right-4 top-[calc(env(safe-area-inset-top,0)+1rem)] z-30 flex items-center gap-4 md:right-6 md:top-6">
        <ThemeToggle />
      </div>

      <LoginAside
        image={loginImage}
        title={loginTitle}
        description={description}
        highlights={featureHighlights}
      />

      <main className="flex min-h-dvh relative flex-1 items-center justify-center transition-colors sm:px-8 md:min-h-full md:px-12">
        <div className="absolute bg-background/40 inset-0 h-full w-full object-cover md:hidden blur-lg  backdrop-blur"></div>
        <img
          src={loginImage}
          alt={t('Page.backgroundAlt')}
          className="absolute inset-0 h-full w-full object-cover blur-lg  md:hidden"
        />
        <Link
          href="/"
          aria-label={t('Page.homeAria')}
          className=" absolute top-2  md:top-4 left-8 p-2 text-foreground  hover:border-primary/50 hover:text-primary"
        >
          <LogoMark className="size-14" />
        </Link>
        <div className="w-full max-w-md  backdrop-blur md:border-none md:bg-transparent md:p-0 md:shadow-none">
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
