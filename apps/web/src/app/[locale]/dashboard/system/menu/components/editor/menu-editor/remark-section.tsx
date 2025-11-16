import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { UseFormReturn } from 'react-hook-form';

import type { MenuFormValues } from '@/app/dashboard/system/menu/type';
import { SectionHeader } from './section-header';
import { useTranslations } from 'next-intl';

export function RemarkSection({ form }: { form: UseFormReturn<MenuFormValues> }) {
  const tSection = useTranslations('MenuManagement.form.sections.remark');
  const { control } = form;

  return (
    <div className="space-y-3">
      <SectionHeader title={tSection('title')} description={tSection('description')} />
      <FormField
        control={control}
        name="remark"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tSection('title')}</FormLabel>
            <FormControl>
              <Textarea
                className="min-h-[96px] resize-none"
                placeholder={tSection('placeholder')}
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
