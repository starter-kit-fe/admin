import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Turnstile from '../turnstile';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { postsignin } from '@/app/auth/api';
import { useStore, AuthStep } from '@/app/auth/store';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { setToken } from '@/lib/cookie';

import { ID_USERINFO } from '@/lib/constant';

const FORM_TEXTS = {
  TITLE: '请输入密码',
  SUBTITLE: '输入密码完成登录',
  PASSWORD_PLACEHOLDER: '输入您的密码',
  SUBMIT_BUTTON: '登录',
  REMEMBER_ME: '记住我',
  PREV_STEP: '上一步',
};

const formSchema = z.object({
  password: z
    .string()
    .min(8, { message: '密码至少需要8个字符。' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: '密码需要包含大小写字母和数字。',
    }),
  token: z.string().min(1, { message: '请进行人机校验' }),
});

const usePasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const queryClient = useQueryClient();
  const { authParams, setParams, setStep, removeParams } =
    useStore();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: 'Admin123.', token: '' },
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: postsignin,
    onSuccess: (data) => {
      setToken(data)
      toast.success('欢迎回来！');
      setStep(AuthStep.Email);
      removeParams();
      queryClient.invalidateQueries({ queryKey: [ID_USERINFO] });
      router.push(from || '/');
    },
    onError: (error) => {
      toast.error('登录失败，请稍后再试！' + error.message);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!authParams) return;
    setParams(values);
    const { email, password, token } = { ...authParams, ...values };
    if (email && password && token) {
      mutate({ email, password: password, token });
    }
  };

  return {
    form,
    onSubmit,
    isPending,
    error,
    showPassword,
    setShowPassword,
    setStep,
  };
};

const PasswordForm: React.FC = React.memo(() => {
  const {
    form,
    onSubmit,
    isPending,
    error,
    showPassword,
    setShowPassword,
    setStep,
  } = usePasswordForm();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto grid w-[350px] z-10 gap-6"
      >
        <div className="grid gap-2 text-left mt-3">
          <h1 className="text-3xl font-bold">{FORM_TEXTS.TITLE}</h1>
          <p className="text-balance text-muted-foreground">
            {FORM_TEXTS.SUBTITLE}
          </p>
        </div>
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input
                      autoFocus
                      type={showPassword ? 'text' : 'password'}
                      placeholder={FORM_TEXTS.PASSWORD_PLACEHOLDER}
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="token"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Turnstile onVerify={(token) => field.onChange(token)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? '提交中...' : FORM_TEXTS.SUBMIT_BUTTON}
            </Button>
            <Button
              className="w-full mt-2"
              variant="outline"
              onClick={() => setStep(AuthStep.Email)}
            >
              {FORM_TEXTS.PREV_STEP}
            </Button>
          </div>
          {error && <p className="text-red-500">{error.message}</p>}
        </div>
      </form>
    </Form>
  );
});

PasswordForm.displayName = 'PasswordForm';

export default PasswordForm;
