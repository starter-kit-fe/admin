import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import {
  Eye,
  EyeOff,
  Lock,
  LogIn,
  RefreshCw,
  ShieldAlert,
  User,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { BaseSyntheticEvent, FC } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import type { LoginValues } from '../schema';

interface LoginFormProps {
  register: UseFormRegister<LoginValues>;
  errors: FieldErrors<LoginValues>;
  showPassword: boolean;
  onTogglePassword: () => void;
  onSubmit: (event?: BaseSyntheticEvent) => void | Promise<void>;
  loginPending: boolean;
  captchaImage?: string;
  captchaFetching: boolean;
  captchaError: boolean;
  countdownLabel: string | null;
  onRefreshCaptcha: () => void;
  isCaptchaExpired: boolean;
}

export const LoginForm: FC<LoginFormProps> = ({
  register,
  errors,
  showPassword,
  onTogglePassword,
  onSubmit,
  loginPending,
  captchaImage,
  captchaFetching,
  captchaError,
  countdownLabel,
  onRefreshCaptcha,
  isCaptchaExpired,
}) => {
  const t = useTranslations('Login');
  const captchaInvalid =
    captchaError || isCaptchaExpired || !captchaImage || captchaFetching;

  return (
    <Card className="border-none bg-transparent md:bg-card  shadow-none  ">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="mb-1 text-2xl font-semibold">
          {t('Form.title')}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {t('Form.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <InputGroup
              data-invalid={errors.username ? 'true' : undefined}
              className="bg-muted"
            >
              <InputGroupAddon>
                <User className="h-4 w-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                id="username"
                placeholder={t('Form.username.placeholder')}
                title={t('Form.username.aria')}
                autoComplete="username"
                tabIndex={1}
                {...register('username')}
                aria-invalid={Boolean(errors.username)}
              />
            </InputGroup>
            {errors.username ? (
              <p className="text-xs text-destructive">
                {errors.username.message}
              </p>
            ) : null}
          </div>

          <div className="">
            <InputGroup
              data-invalid={errors.password ? 'true' : undefined}
              className="bg-muted"
            >
              <InputGroupAddon>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('Form.password.placeholder')}
                title={t('Form.password.aria')}
                tabIndex={2}
                autoComplete="current-password"
                {...register('password')}
                aria-invalid={Boolean(errors.password)}
              />
              <InputGroupAddon align="inline-end" className="pr-2">
                <InputGroupButton
                  size="icon-sm"
                  variant="ghost"
                  aria-label={
                    showPassword
                      ? t('Form.password.hide')
                      : t('Form.password.show')
                  }
                  onClick={onTogglePassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {errors.password ? (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {countdownLabel}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="inline-flex p-0 m-0 text-[11px] gap-0.5 cursor-pointer"
                  onClick={onRefreshCaptcha}
                  disabled={captchaFetching}
                  title={t('Form.captcha.refresh')}
                >
                  <RefreshCw className="size-3" />
                  {t('Form.captcha.refresh')}
                </Button>
              </div>
            </div>
            <InputGroup
              data-invalid={errors.captcha ? 'true' : undefined}
              className="bg-muted"
            >
              <InputGroupAddon>
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                id="captcha"
                placeholder={t('Form.captcha.placeholder')}
                title={t('Form.captcha.aria')}
                tabIndex={3}
                autoComplete="one-time-code"
                {...register('captcha')}
                aria-invalid={Boolean(errors.captcha)}
              />
              <InputGroupAddon
                align="inline-end"
                className="min-w-[120px] justify-end pr-0"
              >
                <Button
                  type="button"
                  variant="ghost"
                  className="flex h-[30px] w-[100px]  items-center justify-center mr-2"
                  onClick={onRefreshCaptcha}
                  title={t('Form.captcha.tapToRefresh')}
                  disabled={captchaFetching}
                >
                  {captchaFetching ? (
                    <Spinner className="h-4 w-4 text-primary" />
                  ) : captchaInvalid ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      {t('Form.captcha.tapToRefresh')}
                    </span>
                  ) : (
                    <img
                      src={captchaImage}
                      alt={t('Form.captcha.alt')}
                      className="h-[40px] w-full rounded-md object-cover"
                    />
                  )}
                </Button>
              </InputGroupAddon>
            </InputGroup>
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
              loginPending ||
              captchaFetching ||
              !captchaImage ||
              isCaptchaExpired
            }
          >
            {loginPending ? (
              <>
                <Spinner /> {t('Form.submit.pending')}
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                {t('Form.submit.idle')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardContent className="pt-0">
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          {t.rich('Form.agreements.notice', {
            terms: (chunks) => (
              <Link
                href="/terms"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link
                href="/privacy"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {chunks}
              </Link>
            ),
            cookies: (chunks) => (
              <Link
                href="/cookies"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </CardContent>
    </Card>
  );
};
