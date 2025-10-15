'use client';

import { InlineLoading } from '@/components/loading';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  TOKEN_STORAGE_KEY,
  emitAuthTokenChange,
  useAuthStatus,
} from '@/hooks/use-auth';
import http from '@/lib/request';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  RefreshCw,
  ShieldAlert,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import pkg from '../../../package.json';

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
  captcha: z.string().min(1, '请输入验证码'),
});

type LoginValues = z.infer<typeof loginSchema>;

interface LoginResponseShape {
  code: number;
  msg: string | null;
  token: string;
}

interface CaptchaResponseShape {
  code: number;
  msg: string | null;
  data?: {
    captcha_id: string;
    image: string;
    expires_in: number;
  };
}

interface CaptchaData {
  id: string;
  image: string;
  expiresIn: number;
}

const featureHighlights = [
  '支持账号密码快速登录，登录后自动缓存权限配置。',
  '登录后可访问 Dashboard、系统日志、Swagger 等后台工具。',
  '我们通过 React Query 管理鉴权状态，确保请求自动携带 Token。',
];

const loginImages = [
  'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80',
];

export default function Page() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStatus();
  const [showPassword, setShowPassword] = useState(false);
  const [isCaptchaExpired, setCaptchaExpired] = useState(false);
  const [captchaCountdown, setCaptchaCountdown] = useState<number | null>(null);
  const [loginImage, setLoginImage] = useState<string>(loginImages[0]);

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
    queryFn: async (): Promise<CaptchaData> => {
      const response =
        await http.get<CaptchaResponseShape['data']>('/v1/auth/captcha');
      if (response.code && response.code !== 200) {
        throw new Error(response.msg ?? '获取验证码失败');
      }
      const payload = response.data ??
        (response as unknown as CaptchaResponseShape).data ?? {
          captcha_id: '',
          image: '',
          expires_in: 120,
        };
      return {
        id: payload.captcha_id,
        image: payload.image,
        expiresIn: payload.expires_in,
      };
    },
    staleTime: 0,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (values: LoginValues) => {
      const payload = {
        username: values.username,
        password: values.password,
        captcha: values.captcha,
        captcha_id: captchaData?.id,
      };
      const response = await http.post<LoginResponseShape>(
        '/v1/auth/login',
        payload,
      );
      const raw = response as unknown as LoginResponseShape;
      const token = raw?.token ?? response.data?.token;
      if (!token) {
        throw new Error(response.msg ?? '登录失败，请稍后重试');
      }
      handleRefreshCaptcha();
      return { token, message: response.msg ?? raw?.msg ?? '登录成功' };
    },
    onSuccess: ({ token, message }) => {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
      http.updateToken(token);
      emitAuthTokenChange();
      toast.success(message);
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
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!captchaData?.id || !captchaData?.expiresIn) {
      return;
    }
    const duration = Math.max(5, Math.floor(captchaData.expiresIn));
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
  }, [captchaData?.id, captchaData?.expiresIn]);

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
    return title.split('—')[0]?.trim() ?? title;
  }, []);

  const countdownLabel =
    captchaCountdown !== null
      ? captchaCountdown > 0
        ? `${captchaCountdown}s 后过期`
        : '验证码已过期'
      : null;

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 md:flex-row">
      <aside className="relative hidden min-h-dvh flex-1 overflow-hidden md:flex">
        <img
          src={loginImage}
          alt="登录背景"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-900/60" />
        <div className="relative z-10 flex flex-1 flex-col justify-between px-10 py-12 text-slate-100">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
              Welcome Back
            </span>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              {loginTitle}
            </h1>
            <p className="max-w-md text-sm text-white/75 md:text-base">
              {pkg.seo?.description ??
                '一套现代化的管理后台模板，集成完善的认证体系与组件库。'}
            </p>
          </div>
          <ul className="space-y-4 text-sm text-white/80 md:text-base">
            {featureHighlights.map((tip) => (
              <li
                key={tip}
                className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
              >
                <span className="flex h-2 w-2 rounded-full bg-emerald-300" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">
            Admin Template
          </p>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-12 md:px-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4 text-center md:hidden">
            <div className="mx-auto h-36 w-full overflow-hidden rounded-3xl bg-slate-200">
              <img
                src={loginImage}
                alt="登录背景"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {loginTitle}
              </h1>
              <p className="text-sm text-muted-foreground">
                登录后体验完整的后台管理能力。
              </p>
            </div>
            <ul className="grid gap-2 text-left text-sm text-muted-foreground">
              {featureHighlights.map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <Card className="border-border/60 bg-white shadow-xl">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-2xl font-semibold">账号登录</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                输入账号信息，以便访问仪表盘与更多后台工具。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-6"
                onSubmit={handleSubmit((values) =>
                  loginMutation.mutate(values),
                )}
              >
                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <User className="h-4 w-4" />
                    </span>
                    <Input
                      id="username"
                      placeholder="输入用户名"
                      title="输入用户名"
                      autoComplete="username"
                      className="pl-9"
                      {...register('username')}
                      aria-invalid={Boolean(errors.username)}
                    />
                  </div>
                  {errors.username ? (
                    <p className="text-xs text-destructive">
                      {errors.username.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </span>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="输入密码"
                      title="输入密码"
                      autoComplete="current-password"
                      className="pl-9 pr-10"
                      {...register('password')}
                      aria-invalid={Boolean(errors.password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? '隐藏密码' : '显示密码'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="text-xs text-destructive">
                      {errors.password.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <Label
                      htmlFor="captcha"
                      className="text-sm text-foreground"
                    >
                      验证码
                    </Label>
                    <div className="flex items-center gap-2">
                      {countdownLabel ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          {countdownLabel}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-primary"
                        onClick={handleRefreshCaptcha}
                        disabled={captchaFetching}
                        title="刷新验证码"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        换一张
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <Input
                      id="captcha"
                      placeholder="输入验证码"
                      title="输入验证码"
                      autoComplete="one-time-code"
                      {...register('captcha')}
                      aria-invalid={Boolean(errors.captcha)}
                    />
                    <div className="flex h-[36px] w-full items-center justify-center rounded-lg border border-border/60 bg-muted/30 sm:w-35">
                      {captchaFetching ? (
                        <Spinner className="h-5 w-5 text-primary" />
                      ) : captchaError ||
                        isCaptchaExpired ||
                        !captchaData?.image ? (
                        <button
                          type="button"
                          className="flex w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                          onClick={handleRefreshCaptcha}
                          title="点击刷新验证码"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          点击刷新
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="h-full w-full overflow-hidden rounded-md"
                          onClick={handleRefreshCaptcha}
                          title="点击刷新验证码"
                        >
                          <img
                            src={captchaData.image}
                            alt="验证码"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      )}
                    </div>
                  </div>
                  {errors.captcha ? (
                    <p className="text-xs text-destructive">
                      {errors.captcha.message}
                    </p>
                  ) : null}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={
                    loginMutation.isPending ||
                    captchaFetching ||
                    !captchaData?.id ||
                    isCaptchaExpired
                  }
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      登录中...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      登录
                    </>
                  )}
                </Button>
              </form>

              {loginMutation.isPending ? (
                <InlineLoading label="正在验证账号信息 ..." className="mt-4" />
              ) : null}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
