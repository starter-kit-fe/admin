import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { MenuFormValues } from '@/app/dashboard/system/menu/type';
import type { MenuParentOption } from '../menu-editor/types';
import { BasicInfoSection } from '../menu-editor/basic-info-section';
import { DirectorySection } from '../menu-editor/directory-section';

interface DirectoryFormProps {
  form: UseFormReturn<MenuFormValues>;
  parentOptions: MenuParentOption[];
}

export function DirectoryForm({ form, parentOptions }: DirectoryFormProps) {
  const permsValue = form.watch('perms');

  useEffect(() => {
    if (permsValue && permsValue.trim() !== '') {
      form.setValue('perms', '', { shouldDirty: false, shouldValidate: false });
    }
  }, [form, permsValue]);

  return (
    <div className="space-y-8">
      <BasicInfoSection form={form} parentOptions={parentOptions} />
      <DirectorySection form={form} />
    </div>
  );
}
