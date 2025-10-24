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
