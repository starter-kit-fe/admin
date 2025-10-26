export interface MenuTreeNode {
  menuId: number;
  menuName: string;
  parentId: number;
  orderNum: number;
  path: string;
  component?: string | null;
  query?: string | null;
  routeName: string;
  isFrame: boolean;
  isCache: boolean;
  menuType: string;
  visible: string;
  status: string;
  perms?: string | null;
  icon: string;
  remark?: string;
  children?: MenuTreeNode[];
}

export type MenuType = 'M' | 'C' | 'F';
export type MenuStatus = '0' | '1';

export interface MenuFormValues {
  menuName: string;
  parentId: string;
  orderNum: string;
  path: string;
  component?: string;
  query?: string;
  routeName: string;
  isFrame: boolean;
  isCache: boolean;
  menuType: MenuType;
  visible: MenuStatus;
  status: MenuStatus;
  perms?: string;
  icon: string;
  remark?: string;
}

export interface CreateMenuPayload {
  menuName: string;
  parentId: number;
  orderNum: number;
  path: string;
  component?: string | null;
  query?: string | null;
  routeName: string;
  isFrame: boolean;
  isCache: boolean;
  menuType: MenuType;
  visible: MenuStatus;
  status: MenuStatus;
  perms?: string | null;
  icon: string;
  remark?: string | null;
}

export type UpdateMenuPayload = Partial<CreateMenuPayload>;

export interface MenuOrderUpdate {
  menuId: number;
  parentId: number;
  orderNum: number;
}
