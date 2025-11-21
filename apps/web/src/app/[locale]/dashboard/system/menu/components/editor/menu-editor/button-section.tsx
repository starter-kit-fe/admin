import {
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
import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import type { MenuFormValues } from '@/app/dashboard/system/menu/type';
import { SectionHeader } from './section-header';

export function ButtonSection({ form }: { form: UseFormReturn<MenuFormValues> }) {
  const t = useTranslations('MenuManagement');
  const { control } = form;

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t('form.sections.button.title')}
        description={t('form.sections.button.description')}
      />
      <FormField
        control={control}
        name="perms"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="mr-1 text-destructive">*</span>
              {t('form.sections.button.fields.perms')}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={t('form.sections.button.fields.permsPlaceholder')}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
        control={control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.sections.button.fields.status')}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('form.sections.button.fields.status')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="0">{t('status.enabled')}</SelectItem>
                <SelectItem value="1">{t('status.disabled')}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
