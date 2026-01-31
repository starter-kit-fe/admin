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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import type { ProfileFormValues } from '../schemas';

type ProfileFormCardProps = {
  form: UseFormReturn<ProfileFormValues>;
  onSubmit: () => void;
  isLoading: boolean;
  submitting: boolean;
};

export function ProfileFormCard({
  form,
  onSubmit,
  isLoading,
  submitting,
}: ProfileFormCardProps) {
  const t = useTranslations('Profile');

  return (
    <Card className="shadow-none  border-none">
      <CardHeader>
        <CardTitle>{t('profileForm.title')}</CardTitle>
        <CardDescription>{t('profileForm.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <Form {...form}>
            <form className="space-y-4" onSubmit={onSubmit}>
              <FormField
                control={form.control}
                name="nickName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('profileForm.fields.nickname')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('profileForm.placeholders.nickname')}
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('profileForm.fields.email')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t('profileForm.placeholders.email')}
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phonenumber"
                  render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('profileForm.fields.phone')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('profileForm.placeholders.phone')}
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('profileForm.fields.sex')}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={submitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('profileForm.placeholders.sex')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">
                          {t('profileForm.sexOptions.male')}
                        </SelectItem>
                        <SelectItem value="1">
                          {t('profileForm.sexOptions.female')}
                        </SelectItem>
                        <SelectItem value="2">
                          {t('profileForm.sexOptions.secret')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('profileForm.fields.remark')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t('profileForm.placeholders.remark')}
                        className="min-h-[96px]"
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
                    ? t('profileForm.submit.pending')
                    : t('profileForm.submit.idle')}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
