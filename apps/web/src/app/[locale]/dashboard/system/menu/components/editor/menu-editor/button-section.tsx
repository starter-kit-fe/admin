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

import type { MenuFormValues } from '@/app/dashboard/system/menu/type';
import { SectionHeader } from './section-header';
import { useTranslations } from 'next-intl';

export function ButtonSection({ form }: { form: UseFormReturn<MenuFormValues> }) {
  const tSection = useTranslations('MenuManagement.form.sections.button');
  const tStatus = useTranslations('MenuManagement.status');
  const { control } = form;

  return (
    <div className="space-y-4">
      <SectionHeader title={tSection('title')} description={tSection('description')} />
      <FormField
        control={control}
        name="perms"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="mr-1 text-destructive">*</span>
              {tSection('fields.perms')}
            </FormLabel>
            <FormControl>
              <Input placeholder={tSection('fields.permsPlaceholder')} {...field} />
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
              <FormLabel>{tSection('fields.status')}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={tSection('fields.status')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="0">{tStatus('enabled')}</SelectItem>
                  <SelectItem value="1">{tStatus('disabled')}</SelectItem>
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
