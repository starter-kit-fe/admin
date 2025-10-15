export interface MenuNode {
  id: number;
  parent_id: number;
  title: string;
  route_name: string;
  path: string;
  menu_type: string;
  icon?: string | null;
  external: boolean;
  visible: string;
  children?: MenuNode[];
}
