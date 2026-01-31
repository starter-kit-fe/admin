import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';

import type { PasswordFormValues } from '../schemas';

type PasswordFormCardProps = {
  form: UseFormReturn<PasswordFormValues>;
  onSubmit: () => void;
  submitting: boolean;
};

export function PasswordFormCard({
  form,
  onSubmit,
  submitting,
}: PasswordFormCardProps) {
  const t = useTranslations('Profile');

  return (
    <Card className="shadow-none  border-none">
      <CardHeader>
        <CardTitle>{t('passwordForm.title')}</CardTitle>
        <CardDescription>{t('passwordForm.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4" onSubmit={onSubmit}>
            <FormField
              control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('passwordForm.fields.current')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                      type="password"
                      autoComplete="current-password"
                      disabled={submitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('passwordForm.fields.new')}</FormLabel>
                    <FormControl>
                      <Input
                      {...field}
                      type="password"
                      autoComplete="new-password"
                      disabled={submitting}
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
                    <FormLabel>{t('passwordForm.fields.confirm')}</FormLabel>
                    <FormControl>
                      <Input
                      {...field}
                      type="password"
                      autoComplete="new-password"
                      disabled={submitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? t('passwordForm.submit.pending')
                  : t('passwordForm.submit.idle')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
