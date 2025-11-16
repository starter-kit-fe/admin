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

import { MenuIconSelect } from '../menu-icon-select';
import { SectionHeader } from './section-header';
import { useTranslations } from 'next-intl';

export function DirectorySection({
  form,
}: {
  form: UseFormReturn<MenuFormValues>;
}) {
  const tSection = useTranslations('MenuManagement.form.sections.directory');
  const tStatus = useTranslations('MenuManagement.status');
  const { control } = form;

  return (
    <div className="space-y-4">
      <SectionHeader
        title={tSection('title')}
        description={tSection('description')}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="path"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="mr-1 text-destructive">*</span>
                {tSection('fields.path')}
              </FormLabel>
              <FormControl>
                <Input placeholder={tSection('fields.pathPlaceholder')} {...field} />
              </FormControl>
              <FormDescription>{tSection('fields.pathDescription')}</FormDescription>
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
                {tSection('fields.icon')}
              </FormLabel>
              <FormControl>
                <MenuIconSelect
                  value={field.value}
                  onChange={field.onChange}
                  allowEmpty={false}
                  placeholder={tSection('fields.iconPlaceholder')}
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
      <FormField
        control={control}
        name="remark"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tSection('fields.remark')}</FormLabel>
            <FormControl>
              <Textarea
                className="min-h-[96px] resize-none"
                placeholder={tSection('fields.remarkPlaceholder')}
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
