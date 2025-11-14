import type { UseFormReturn } from 'react-hook-form';

import type { MenuFormValues } from '@/app/dashboard/system/menu/type';
import type { MenuParentOption } from '../menu-editor/types';
import { BasicInfoSection } from '../menu-editor/basic-info-section';
import { ButtonSection } from '../menu-editor/button-section';
import { RemarkSection } from '../menu-editor/remark-section';

interface ButtonFormProps {
  form: UseFormReturn<MenuFormValues>;
  parentOptions: MenuParentOption[];
}

export function ButtonForm({ form, parentOptions }: ButtonFormProps) {
  return (
    <div className="space-y-8">
      <BasicInfoSection form={form} parentOptions={parentOptions} />
      <ButtonSection form={form} />
      <RemarkSection form={form} />
    </div>
  );
}
