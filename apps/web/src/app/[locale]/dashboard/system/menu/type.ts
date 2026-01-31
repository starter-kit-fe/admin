export type MenuType = 'M' | 'C' | 'F';
export type MenuStatus = '0' | '1';

export interface MenuTreeNode {
  id: number;
  menuName: string;
  parentId: number;
  orderNum: number;
  path: string;
  query?: string | null;
  isFrame: boolean;
  isCache: boolean;
  menuType: MenuType;
  visible: MenuStatus;
  status: MenuStatus;
  perms?: string | null;
  icon: string;
  remark?: string;
  children?: MenuTreeNode[];
}

export interface MenuFormValues {
  menuName: string;
  parentId: string;
  orderNum: string;
  path: string;
  query: string;
  isFrame: boolean;
  isCache: boolean;
  menuType: MenuType;
  visible: MenuStatus;
  status: MenuStatus;
  perms: string;
  icon: string;
  remark: string;
}

export interface CreateMenuPayload {
  menuName: string;
  parentId: number;
  orderNum: number;
  path: string;
  query?: string | null;
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
  id: number;
  parentId: number;
  orderNum: number;
}
