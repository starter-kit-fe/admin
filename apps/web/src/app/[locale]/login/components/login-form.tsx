import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@repo/ui/components/input-group';
import { Button } from '@repo/ui/components/button';
import { Spinner } from '@repo/ui/components/spinner';
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
    <Card className="border-none bg-transparent md:bg-card shadow-none">
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
          {/* Username */}
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

          {/* Password */}
          <div className="space-y-2">
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

          {/* Captcha */}
          <div className="space-y-2">
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
              <InputGroupAddon align="inline-end" className="pr-2">
                <InputGroupButton
                  size="icon-sm"
                  variant="ghost"
                  className="w-20 overflow-hidden"
                  onClick={onRefreshCaptcha}
                  title={t('Form.captcha.tapToRefresh')}
                  disabled={captchaFetching}
                >
                  {captchaFetching ? (
                    <Spinner className="size-4" />
                  ) : captchaInvalid ? (
                    <ShieldAlert className="size-4" />
                  ) : (
                    <img
                      src={captchaImage}
                      alt={t('Form.captcha.alt')}
                      className="h-full w-full rounded-sm object-cover"
                    />
                  )}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>

            <div className="flex items-start justify-between gap-2 min-h-[20px]">
              <div className="flex-1">
                {errors.captcha ? (
                  <p className="text-xs text-destructive">
                    {errors.captcha.message}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center justify-end gap-2">
                {countdownLabel ? (
                  <span className="rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                    {countdownLabel}
                  </span>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto gap-1 p-0 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={onRefreshCaptcha}
                  disabled={captchaFetching}
                  title={t('Form.captcha.refresh')}
                >
                  <RefreshCw className="size-3" />
                  {t('Form.captcha.refresh')}
                </Button>
              </div>
            </div>
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
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {chunks}
              </Link>
            ),
            cookies: (chunks) => (
              <Link
                href="/cookies"
                target="_blank"
                rel="noopener noreferrer"
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
