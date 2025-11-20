'use client';

import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';

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

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .trim()
      .min(6, '至少 6 位字符')
      .max(64, '不超过 64 位字符'),
    confirmPassword: z.string().trim(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

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
      toast.success('密码已重置');
      setResetPasswordTarget(null);
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '重置密码失败，请稍后再试';
      toast.error(message);
    },
    onSettled: () => {
      endMutation();
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const userId = resetPasswordTarget?.userId;
    if (!userId) {
      toast.error('未找到需要重置的用户');
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
          <ResponsiveDialog.Title>重置密码</ResponsiveDialog.Title>
          <ResponsiveDialog.Description>
            为用户「{displayName}」设置一个新的登录密码。
          </ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <Form {...form}>
          <form
            className={cn('flex h-full min-h-0 flex-col', isMobile && 'pt-2')}
            onSubmit={handleSubmit}
          >
            <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pr-1 sm:pr-0">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>新密码</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="至少 6 位字符"
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
                    <FormLabel>确认新密码</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="再次输入新密码"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="text-sm text-muted-foreground">
                密码将会立即生效，请及时将新密码通知给用户。
              </p>
            </div>
            <ResponsiveDialog.Footer
              className={cn(
                'mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end',
                isMobile &&
                  'sticky bottom-0 left-0 right-0 z-10 w-full flex-row items-center justify-between gap-3 rounded-none border-t border-border/60 bg-card/95 px-4 py-4 backdrop-blur sm:static sm:justify-end sm:border-none sm:bg-transparent sm:px-0 sm:py-0',
              )}
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetPasswordTarget(null)}
                disabled={mutation.isPending}
                className={cn(isMobile && 'flex-1')}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className={cn(isMobile && 'flex-1')}
              >
                {mutation.isPending ? '提交中...' : '确定'}
              </Button>
            </ResponsiveDialog.Footer>
          </form>
        </Form>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}
