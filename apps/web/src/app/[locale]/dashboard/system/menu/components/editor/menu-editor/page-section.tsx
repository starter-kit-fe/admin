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
import { useTranslations } from 'next-intl';

import type { MenuFormValues } from '@/app/dashboard/system/menu/type';
import { SectionHeader } from './section-header';
import { MenuIconSelect } from '../menu-icon-select';

export function PageSection({ form }: { form: UseFormReturn<MenuFormValues> }) {
  const t = useTranslations('MenuManagement');
  const { control } = form;

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t('form.sections.menu.title')}
        description={t('form.sections.menu.description')}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="path"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>{t('form.sections.menu.fields.path')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('form.sections.menu.fields.pathPlaceholder')}
                  {...field}
                />
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
              <FormLabel>{t('form.sections.menu.fields.query')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('form.sections.menu.fields.queryPlaceholder')}
                  {...field}
                />
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
                <FormLabel className="font-medium">
                  {t('form.sections.menu.fields.external.label')}
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  {t('form.sections.menu.fields.external.description')}
                </p>
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
                <FormLabel className="font-medium">
                  {t('form.sections.menu.fields.cache.label')}
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  {t('form.sections.menu.fields.cache.description')}
                </p>
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
              <FormLabel>{t('form.sections.menu.fields.icon')}</FormLabel>
              <FormControl>
                <MenuIconSelect
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('form.sections.menu.fields.iconPlaceholder')}
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
              <FormLabel>{t('form.sections.menu.fields.visible')}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.sections.menu.fields.visible')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="0">{t('visibility.visible')}</SelectItem>
                  <SelectItem value="1">{t('visibility.hidden')}</SelectItem>
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
              <FormLabel>{t('form.sections.menu.fields.status')}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.sections.menu.fields.status')} />
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
        <FormField
          control={control}
          name="perms"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>{t('form.sections.menu.fields.perms')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('form.sections.menu.fields.permsPlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
