import React from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import GoogleLogin from '../google-login';
import { getCheckEmailExists } from '@/app/auth/_api';
import { useAuthStore, AuthStep } from '@/app/auth/_store';

const FORM_TEXTS = {
  TITLE: '登录/注册',
  SUBTITLE: '输入邮箱密码进行下一步,未注册邮箱将进行注册',
  EMAIL_PLACEHOLDER: '输入您的邮箱',
  SUBMIT_BUTTON: '下一步',
  THIRD_PARTY_LOGIN: '第三方登录',
  TERMS_AGREEMENT: '进行操作即代表同意网站',
  TERMS_OF_SERVICE: '服务协议',
  PRIVACY_POLICY: '隐私条款',
};

const formSchema = z.object({
  email: z.string().email({ message: '请输入有效的电子邮件地址。' }),
});

const useEmailForm = () => {
  const { setParams, setStep } = useAuthStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  const { mutate, isPending, error } = useMutation({
    mutationFn: (email: string) => getCheckEmailExists(email),
    onSuccess: (data, variables) => {
      debugger;
      setParams({
        email: variables,
        isExists: data,
      });
      if (data) {
        setStep(AuthStep.Password);
      } else {
        setStep(AuthStep.Register);
      }
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    debugger;
    mutate(values.email);
  };

  return { form, onSubmit, isPending, error };
};

const EmailForm: React.FC = React.memo(() => {
  const { form, onSubmit, isPending } = useEmailForm();

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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    autoFocus
                    placeholder={FORM_TEXTS.EMAIL_PLACEHOLDER}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? '提交中...' : FORM_TEXTS.SUBMIT_BUTTON}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {FORM_TEXTS.THIRD_PARTY_LOGIN}
              </span>
            </div>
          </div>
          <GoogleLogin />
          <div className="select-none text-left text-sm text-muted-foreground">
            {FORM_TEXTS.TERMS_AGREEMENT}
            <Link
              href="/terms"
              target="_blank"
              className="underline underline-offset-4 hover:text-primary"
            >
              {FORM_TEXTS.TERMS_OF_SERVICE}
            </Link>{' '}
            和{' '}
            <Link
              href="/privacy"
              target="_blank"
              className="underline underline-offset-4 hover:text-primary"
            >
              {FORM_TEXTS.PRIVACY_POLICY}
            </Link>
            .
          </div>
        </div>
      </form>
    </Form>
  );
});

EmailForm.displayName = 'EmailForm';

export default EmailForm;
