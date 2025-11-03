export interface MenuParentOption {
  label: string;
  value: string;
  level: number;
  path: string[];
  parentId?: string;
  disabled?: boolean;
}
