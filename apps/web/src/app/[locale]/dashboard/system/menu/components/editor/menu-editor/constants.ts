import type { MenuType } from '@/app/dashboard/system/menu/type';

export const MENU_TYPE_OPTIONS: Array<{
  value: MenuType;
  labelKey: `form.typeTabs.options.${MenuType}.label`;
  descriptionKey: `form.typeTabs.options.${MenuType}.description`;
}> = [
  { value: 'M', labelKey: 'form.typeTabs.options.M.label', descriptionKey: 'form.typeTabs.options.M.description' },
  { value: 'C', labelKey: 'form.typeTabs.options.C.label', descriptionKey: 'form.typeTabs.options.C.description' },
  { value: 'F', labelKey: 'form.typeTabs.options.F.label', descriptionKey: 'form.typeTabs.options.F.description' },
];

export const MENU_TYPE_HINTS: Record<
  MenuType,
  {
    titleKey: `form.typeTabs.hints.${MenuType}.title`;
    helperKey: `form.typeTabs.hints.${MenuType}.helper`;
  }
> = {
  M: {
    titleKey: 'form.typeTabs.hints.M.title',
    helperKey: 'form.typeTabs.hints.M.helper',
  },
  C: {
    titleKey: 'form.typeTabs.hints.C.title',
    helperKey: 'form.typeTabs.hints.C.helper',
  },
  F: {
    titleKey: 'form.typeTabs.hints.F.title',
    helperKey: 'form.typeTabs.hints.F.helper',
  },
};
