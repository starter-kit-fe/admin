import type { MenuType } from '../../type';

export const MENU_TYPE_OPTIONS: Array<{ label: string; value: MenuType; description: string }> = [
  { label: '目录', value: 'M', description: '仅作为分组容器，不可点击跳转' },
  { label: '菜单', value: 'C', description: '常规路由菜单，对应页面组件' },
  { label: '按钮', value: 'F', description: '仅用于权限控制，不在侧边栏展示' },
];

export const MENU_TYPE_HINTS: Record<
  MenuType,
  {
    title: string;
    helper: string;
  }
> = {
  M: {
    title: '目录适合用来划分侧边栏层级，通常不对应真实页面。',
    helper: '仅需维护路由地址与图标，可留空组件路径；权限控制请交给其子菜单或按钮处理。',
  },
  C: {
    title: '菜单与具体页面绑定，需要完整的页面与路由配置。',
    helper: '请配置组件路径、路由地址与必要的权限标识，确保菜单与页面、权限保持一致。',
  },
  F: {
    title: '按钮用于权限点控制，不在导航结构中展示。',
    helper: '无需设置路由及组件，只需维护权限标识，用于控制页面内部的操作按钮显示。',
  },
};
