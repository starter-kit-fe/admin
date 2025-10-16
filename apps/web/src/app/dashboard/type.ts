export interface MenuMeta {
  title: string;
  icon?: string | null;
  noCache?: boolean;
  link?: string | null;
}

export interface MenuNode {
  name: string;
  path: string;
  hidden?: boolean;
  redirect?: string | null;
  component?: string | null;
  alwaysShow?: boolean;
  meta?: MenuMeta | null;
  children?: MenuNode[];
}
