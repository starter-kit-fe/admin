'use client';

import { useEffect, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { cn } from '@/lib/utils';

import { useMediaQuery } from '@/hooks/use-media-query';

import { resetUserPassword } from '../../api';
import {
  useUserManagementMutationCounter,
  useUserManagementRefresh,
  useUserManagementStore,
} from '../../store';

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

const DEFAULT_VALUES: ResetPasswordFormValues = {
  password: '',
  confirmPassword: '',
};

export function UserResetPasswordDialog() {
  const {
    resetPasswordTarget,
    setResetPasswordTarget,
  } = useUserManagementStore();
  const refresh = useUserManagementRefresh();
  const { beginMutation, endMutation } = useUserManagementMutationCounter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const tDialogs = useTranslations('UserManagement.dialogs');
  const tToast = useTranslations('UserManagement.toast');
  const tForm = useTranslations('UserManagement.form');

  const validationMessages = useMemo(() => ({
    min: tForm('validation.password.min'),
    max: tForm('validation.password.max'),
    mismatch: tForm('validation.password.mismatch'),
  }), [tForm]);

  const resetPasswordSchema = useMemo(
    () =>
      z
        .object({
          password: z.string().trim().min(6, validationMessages.min).max(64, validationMessages.max),
          confirmPassword: z.string().trim(),
        })
        .refine((values) => values.password === values.confirmPassword, {
          message: validationMessages.mismatch,
          path: ['confirmPassword'],
        }),
    [validationMessages],
  );

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onSubmit',
  });

  const open = Boolean(resetPasswordTarget);

  useEffect(() => {
    if (open) {
      form.reset(DEFAULT_VALUES);
    }
  }, [form, open]);

  const mutation = useMutation({
    mutationFn: ({ userId, password }: { userId: number; password: string }) =>
      resetUserPassword(userId, { password }),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(tToast('resetSuccess'));
      setResetPasswordTarget(null);
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : tToast('resetError');
      toast.error(message);
    },
    onSettled: () => {
      endMutation();
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const userId = resetPasswordTarget?.userId;
    if (!userId) {
      toast.error(tToast('resetMissing'));
      return;
    }
    mutation.mutate({
      userId,
      password: values.password.trim(),
    });
  });

  const displayName = resetPasswordTarget
    ? resetPasswordTarget.nickName || resetPasswordTarget.userName
    : '';

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setResetPasswordTarget(null);
        }
      }}
    >
      <ResponsiveDialog.Content className="sm:max-w-md">
        <ResponsiveDialog.Header className={cn(isMobile && 'hidden')}>
          <ResponsiveDialog.Title>{tDialogs('resetPasswordTitle')}</ResponsiveDialog.Title>
          <ResponsiveDialog.Description>
            {tDialogs('resetPasswordDescription', { name: displayName })}
          </ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <Form {...form}>
          <form className={cn('space-y-4', isMobile && 'pb-24')} onSubmit={handleSubmit}>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('newPassword')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder={tForm('newPasswordPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('confirmPassword')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder={tForm('confirmPasswordPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-sm text-muted-foreground">
              {tDialogs('resetPasswordNote')}
            </p>
            <ResponsiveDialog.Footer
              className={cn(
                'flex flex-col gap-2 sm:flex-row sm:justify-end',
                isMobile &&
                  'sticky bottom-0 left-0 right-0 w-full rounded-none border-t border-border/60 bg-card/95 px-4 py-3 backdrop-blur sm:static sm:border-none sm:bg-transparent sm:px-0 sm:py-0',
              )}
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetPasswordTarget(null)}
                disabled={mutation.isPending}
                className={cn(isMobile && 'flex-1 basis-2/5')}
              >
                {tDialogs('resetPasswordCancel')}
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className={cn(isMobile && 'flex-1 basis-3/5')}
              >
                {mutation.isPending
                  ? tForm('submit.creating')
                  : tDialogs('resetPasswordConfirm')}
              </Button>
            </ResponsiveDialog.Footer>
          </form>
        </Form>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}
