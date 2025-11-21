import type { MenuFormValues } from '@/app/dashboard/system/menu/type';
import {
  FormControl,
  FormDescription,
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
import { Textarea } from '@/components/ui/textarea';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { MenuIconSelect } from '../menu-icon-select';
import { SectionHeader } from './section-header';

export function DirectorySection({
  form,
}: {
  form: UseFormReturn<MenuFormValues>;
}) {
  const t = useTranslations('MenuManagement');
  const { control } = form;

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t('form.sections.directory.title')}
        description={t('form.sections.directory.description')}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="path"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="mr-1 text-destructive">*</span>
                {t('form.sections.directory.fields.path')}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t('form.sections.directory.fields.pathPlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t('form.sections.directory.fields.pathDescription')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="mr-1 text-destructive">*</span>
                {t('form.sections.directory.fields.icon')}
              </FormLabel>
              <FormControl>
                <MenuIconSelect
                  value={field.value}
                  onChange={field.onChange}
                  allowEmpty={false}
                  placeholder={t('form.sections.directory.fields.iconPlaceholder')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.sections.directory.fields.status')}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.sections.directory.fields.status')} />
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
      <FormField
        control={control}
        name="remark"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.sections.directory.fields.remark')}</FormLabel>
            <FormControl>
              <Textarea
                className="min-h-[96px] resize-none"
                placeholder={t('form.sections.directory.fields.remarkPlaceholder')}
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
