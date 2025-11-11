import type { MenuType } from '@/app/dashboard/system/menu/type';

export interface MenuParentOption {
  label: string;
  value: string;
  level: number;
  path: string[];
  parentId?: string;
  disabled?: boolean;
  menuType?: MenuType;
}
