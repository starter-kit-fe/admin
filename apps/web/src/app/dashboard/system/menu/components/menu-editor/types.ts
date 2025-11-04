import type { MenuType } from '../../type';

export interface MenuParentOption {
  label: string;
  value: string;
  level: number;
  path: string[];
  parentId?: string;
  disabled?: boolean;
  menuType?: MenuType;
}
