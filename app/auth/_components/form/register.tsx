'use client';

import React, { useState, useEffect } from 'react';

import * as z from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Turnstile from '../turnstile';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import { postSignup, postCode } from '@/app/auth/api';
import { AuthStep, useStore } from '@/app/auth/store';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { ID_USERINFO } from '@/lib/constant';
import { useRouter, useSearchParams } from 'next/navigation';
import Show from '@/components/show';
import { setToken } from '@/lib/cookie';
const FORM_TEXTS = {
  TITLE: '请输入密码',
  SUBTITLE: '输入密码并完成验证注册',
  PASSWORD_PLACEHOLDER: '输入您的密码',
  SUBMIT_BUTTON: '注册',
  SEND_CODE_BUTTON: '发送验证码',
  PREV_STEP: '上一步',
};

const passwordSchema = z
  .string()
  .min(8, { message: '密码至少8个字符' })
  .refine((password) => !password.includes(' '), {
    message: '密码不能包含空格',
  })
  .refine((password) => /\d/.test(password), {
    message: '密码至少包含一位数字',
  })
  .refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
    message: '密码至少包含一位特殊字符，例如：$, !, @, %, &',
  });

const formSchema = z.object({
  password: passwordSchema,
  token: z.string().min(6, { message: 'token不能为空' }),
  code: z.string().length(6, { message: '请输入6位验证码' }),
});

const PasswordStrengthIndicator = ({ password = '' }) => {
  const getStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[a-zA-Z]/.test(password)) strength += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
    return (strength / 4) * 100;
  };
  const strength = getStrength(password);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }} // 初始状态
      animate={{
        height: password.length > 0 ? 'auto' : 0,
        opacity: password.length > 0 ? 1 : 0,
      }} // 动画状态
      transition={{ duration: 0.3 }} // 过渡时间
      style={{ overflow: 'hidden' }} // 防止内容溢出
    >
      <div className="mt-2">
        <Progress value={strength} className="w-full h-2 bg-red" />
        <ul className="text-sm text-muted-foreground mt-1">
          <li className={!password.includes(' ') ? 'line-through' : ''}>
            密码不能包含空格
          </li>
          <li className={password.length >= 8 ? 'line-through' : ''}>
            密码至少8个字符
          </li>
          <li className={/\d/.test(password) ? 'line-through' : ''}>
            密码至少包含一位数字
          </li>
          <li
            className={
              /[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'line-through' : ''
            }
          >
            密码至少包含一位特殊字符，例如：$, !, @, %, &
          </li>
        </ul>
      </div>
    </motion.div>
  );
};

const usePasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const queryClient = useQueryClient();
  const { authParams, setParams, setStep, removeParams } =
    useStore();
  const [countdown, setCountdown] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '', token: '', code: '' },
  });

  const signinMutation = useMutation({
    mutationFn: postSignup,
    onSuccess: (data) => {
      setToken(data);
      toast.success('注册成功,欢迎加入！');
      queryClient.invalidateQueries({ queryKey: [ID_USERINFO] });
      router.push(from || '/');
      removeParams();
      setTimeout(() => {
        setStep(AuthStep.Email);
      }, 0);
    },
    onError: (error) => {
      toast.error('登录失败:' + error.message);
    },
  });

  const sendCodeMutation = useMutation({
    mutationFn: postCode,
    onSuccess: () => {
      setCountdown(60);
      toast.info('验证码已发送,请检查您的邮箱!');
    },
    onError: (error) => {
      toast.error('发送失败:' + error.message);
    },
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!authParams?.email) return;
    setParams({ ...authParams, ...values });
    signinMutation.mutate({
      email: authParams.email,
      password: values.password,
      token: values.code,
      code: values.code,
    });
  };

  const handleSendCode = () => {
    if (!authParams?.email) return;
    sendCodeMutation.mutate({
      email: authParams.email,
      token: form.getValues('token'),
    });
  };

  return {
    form,
    onSubmit,
    handleSendCode,
    countdown,
    isEmailPeding: sendCodeMutation.isPending,
    isPending: signinMutation.isPending,
    authParams,
    setStep,
  };
};

export default function PasswordForm() {
  const {
    form,
    onSubmit,
    handleSendCode,
    countdown,
    isPending,
    authParams,
    isEmailPeding,
    setStep,
  } = usePasswordForm();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <Card className="w-[400px] mx-auto">
      <CardHeader>
        <CardTitle>{FORM_TEXTS.TITLE}</CardTitle>
        <CardDescription>
          验证码已发送至 <strong>{authParams?.email}</strong>{' '}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex gap-2 justify-start items-center">
                      <InputOTP className="flex-1" maxLength={6} {...field}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                      <Show
                        when={!loading && !isEmailPeding}
                        fallback={<Loader2 className="animate-spin" />}
                      >
                        <Button
                          type="button"
                          onClick={handleSendCode}
                          disabled={countdown > 0 || isEmailPeding}
                          variant="outline"
                          className="whitespace-nowrap"
                        >
                          {countdown > 0
                            ? `${countdown}s`
                            : FORM_TEXTS.SEND_CODE_BUTTON}
                        </Button>
                      </Show>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={FORM_TEXTS.PASSWORD_PLACEHOLDER}
                        {...field}
                        aria-describedby="password-strength"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? 'Hide password' : 'Show password'}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                  <PasswordStrengthIndicator password={field.value} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Turnstile
                      onVerify={(val) => {
                        field.onChange(val);
                        handleSendCode();
                        setLoading(false);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <Button
                type="submit"
                className="w-full mb-2"
                disabled={isPending}
              >
                <Show
                  when={!isPending}
                  fallback={
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      登录中...
                    </span>
                  }
                >
                  {FORM_TEXTS.SUBMIT_BUTTON}
                </Show>
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setStep(AuthStep.Email)}
              >
                {FORM_TEXTS.PREV_STEP}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
