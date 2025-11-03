import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { UseFormReturn } from 'react-hook-form';

import type { MenuFormValues } from '../../type';
import { SectionHeader } from './section-header';

export function RemarkSection({ form }: { form: UseFormReturn<MenuFormValues> }) {
  const { control } = form;

  return (
    <div className="space-y-3">
      <SectionHeader title="备注" description="可选，用于补充该菜单的说明。" />
      <FormField
        control={control}
        name="remark"
        render={({ field }) => (
          <FormItem>
            <FormLabel>备注</FormLabel>
            <FormControl>
              <Textarea className="min-h-[96px] resize-none" placeholder="请输入备注（可选）" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
