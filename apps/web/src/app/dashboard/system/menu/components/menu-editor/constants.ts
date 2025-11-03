import type { MenuType } from '../../type';

export const MENU_TYPE_OPTIONS: Array<{ label: string; value: MenuType; description: string }> = [
  { label: '目录', value: 'M', description: '仅作为分组容器，不可点击跳转' },
  { label: '菜单', value: 'C', description: '常规路由菜单，对应页面组件' },
  { label: '按钮', value: 'F', description: '仅用于权限控制，不在侧边栏展示' },
];
