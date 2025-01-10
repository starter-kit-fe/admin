import React from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Database } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getCheckEmailExists } from '@/app/auth/_api';
import { useAuthStore, AuthStep } from '@/app/auth/_store';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CopyButton from '@/components/copy';

const formSchema = z.object({
  dbUrl: z.string().min(1, { message: '请输入数据库地址' }),
});

const useEmailForm = () => {
  const { setParams, setStep } = useAuthStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { dbUrl: '' },
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
    mutate(values.dbUrl);
  };

  return { form, onSubmit, isPending, error };
};

const EmailForm: React.FC = React.memo(() => {
  const { form, onSubmit, isPending } = useEmailForm();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto grid w-[520px] z-10 gap-6"
      >
        <div className="grid gap-2 text-left mt-3">
          <h1 className="text-3xl font-bold">数据库</h1>

          <Alert>
            <Database className="h-4 w-4" />
            <AlertTitle className="text-muted-foreground">
              数据库链接示例
            </AlertTitle>
            <AlertDescription className="text-muted-foreground text-xs mt-2 flex gap-2">
              <p>
                postgresql://postgres:SUq+xmsFg7SwoBwfCYuUFw==@127.0.0.1:5432/voh?sslmode=disable&timezone=Asia/Shanghai
              </p>
              <p>
                <CopyButton text="postgresql://postgres:SUq+xmsFg7SwoBwfCYuUFw==@127.0.0.1:5432/voh?sslmode=disable&timezone=Asia/Shanghai" />
              </p>
            </AlertDescription>
          </Alert>
        </div>
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="dbUrl"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input autoFocus placeholder="请输入数据库链接" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dbUrl"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input autoFocus placeholder="请输入redis链接" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
});

EmailForm.displayName = 'EmailForm';

export default EmailForm;
