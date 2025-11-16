import type { MenuType } from '@/app/dashboard/system/menu/type';

export const MENU_TYPE_OPTIONS: Array<{
  value: MenuType;
  labelKey: `typeTabs.options.${MenuType}.label`;
  descriptionKey: `typeTabs.options.${MenuType}.description`;
}> = [
  {
    value: 'M',
    labelKey: 'typeTabs.options.M.label',
    descriptionKey: 'typeTabs.options.M.description',
  },
  {
    value: 'C',
    labelKey: 'typeTabs.options.C.label',
    descriptionKey: 'typeTabs.options.C.description',
  },
  {
    value: 'F',
    labelKey: 'typeTabs.options.F.label',
    descriptionKey: 'typeTabs.options.F.description',
  },
];

export const MENU_TYPE_HINTS: Record<
  MenuType,
  {
    titleKey: `typeTabs.hints.${MenuType}.title`;
    helperKey: `typeTabs.hints.${MenuType}.helper`;
  }
> = {
  M: {
    titleKey: 'typeTabs.hints.M.title',
    helperKey: 'typeTabs.hints.M.helper',
  },
  C: {
    titleKey: 'typeTabs.hints.C.title',
    helperKey: 'typeTabs.hints.C.helper',
  },
  F: {
    titleKey: 'typeTabs.hints.F.title',
    helperKey: 'typeTabs.hints.F.helper',
  },
};
