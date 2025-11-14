import type { UseFormReturn } from 'react-hook-form';

import type { MenuFormValues } from '@/app/dashboard/system/menu/type';
import type { MenuParentOption } from '../menu-editor/types';
import { BasicInfoSection } from '../menu-editor/basic-info-section';
import { PageSection } from '../menu-editor/page-section';
import { RemarkSection } from '../menu-editor/remark-section';

interface MenuFormProps {
  form: UseFormReturn<MenuFormValues>;
  parentOptions: MenuParentOption[];
}

export function MenuForm({ form, parentOptions }: MenuFormProps) {
  return (
    <div className="space-y-8">
      <BasicInfoSection form={form} parentOptions={parentOptions} />
      <PageSection form={form} />
      <RemarkSection form={form} />
    </div>
  );
}
