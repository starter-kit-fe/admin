import { Switch } from '@/components/ui/switch';
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
import { MenuIconSelect } from '../menu-icon-select';
import { useTranslations } from 'next-intl';

export function PageSection({ form }: { form: UseFormReturn<MenuFormValues> }) {
  const tSection = useTranslations('MenuManagement.form.sections.menu');
  const tStatus = useTranslations('MenuManagement.status');
  const tVisibility = useTranslations('MenuManagement.visibility');
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
              <FormItem className="md:col-span-2">
                <FormLabel>{tSection('fields.path')}</FormLabel>
                <FormControl>
                  <Input placeholder={tSection('fields.pathPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
        />
        <FormField
          control={control}
          name="query"
          render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{tSection('fields.query')}</FormLabel>
                <FormControl>
                  <Input placeholder={tSection('fields.queryPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="isFrame"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3">
              <div>
                <FormLabel className="font-medium">{tSection('fields.external.label')}</FormLabel>
                <p className="text-xs text-muted-foreground">{tSection('fields.external.description')}</p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="isCache"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3">
              <div>
                <FormLabel className="font-medium">{tSection('fields.cache.label')}</FormLabel>
                <p className="text-xs text-muted-foreground">{tSection('fields.cache.description')}</p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
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
              <FormLabel>{tSection('fields.icon')}</FormLabel>
              <FormControl>
                <MenuIconSelect
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={tSection('fields.iconPlaceholder')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="visible"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tSection('fields.visible')}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={tSection('fields.visible')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="0">{tVisibility('visible')}</SelectItem>
                  <SelectItem value="1">{tVisibility('hidden')}</SelectItem>
                </SelectContent>
              </Select>
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
        <FormField
          control={control}
          name="perms"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>{tSection('fields.perms')}</FormLabel>
              <FormControl>
                <Input placeholder={tSection('fields.permsPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
