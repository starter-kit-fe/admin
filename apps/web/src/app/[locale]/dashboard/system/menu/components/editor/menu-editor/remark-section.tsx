import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import type { MenuFormValues } from '@/app/dashboard/system/menu/type';
import { SectionHeader } from './section-header';

export function RemarkSection({ form }: { form: UseFormReturn<MenuFormValues> }) {
  const t = useTranslations('MenuManagement');
  const { control } = form;

  return (
    <div className="space-y-3">
      <SectionHeader
        title={t('form.sections.remark.title')}
        description={t('form.sections.remark.description')}
      />
      <FormField
        control={control}
        name="remark"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.sections.remark.title')}</FormLabel>
            <FormControl>
              <Textarea
                className="min-h-[96px] resize-none"
                placeholder={t('form.sections.remark.placeholder')}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
