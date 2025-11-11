import type { MenuParentOption } from './components/editor/menu-editor/types';
import type { CreateMenuPayload, MenuFormValues, MenuTreeNode } from './type';

export function toFormValues(menu: MenuTreeNode): MenuFormValues {
  return {
    menuName: menu.menuName ?? '',
    parentId: String(menu.parentId ?? 0),
    orderNum: menu.orderNum != null ? String(menu.orderNum) : '',
    path: menu.path ?? '',
    query: menu.query ?? '',
    isFrame: Boolean(menu.isFrame),
    isCache: Boolean(menu.isCache),
    menuType: menu.menuType as MenuFormValues['menuType'],
    visible: menu.visible as MenuFormValues['visible'],
    status: menu.status as MenuFormValues['status'],
    perms: menu.perms ?? '',
    icon: menu.icon && menu.icon !== '#' ? menu.icon : '',
    remark: menu.remark ?? '',
  };
}

export function toCreatePayload(values: MenuFormValues): CreateMenuPayload {
  const parentId = Number(values.parentId) || 0;
  const orderNum = values.orderNum.trim() === '' ? 0 : Number(values.orderNum);
  return {
    menuName: values.menuName.trim(),
    parentId,
    orderNum,
    path: values.path.trim(),
    query: values.query?.trim() || undefined,
    isFrame: values.isFrame,
    isCache: values.isCache,
    menuType: values.menuType,
    visible: values.visible,
    status: values.status,
    perms: values.perms?.trim() || undefined,
    icon: values.icon.trim() || '#',
    remark: values.remark?.trim() || undefined,
  };
}

export function buildParentOptions(nodes: MenuTreeNode[]): MenuParentOption[] {
  const options: MenuParentOption[] = [
    {
      value: '0',
      label: '根目录',
      level: 0,
      path: ['根目录'],
      disabled: false,
      menuType: 'M',
    },
  ];

  const walk = (
    items: MenuTreeNode[],
    depth: number,
    ancestors: string[],
    parentId: number,
  ) => {
    items.forEach((item) => {
      const currentPath = [...ancestors, item.menuName];
      options.push({
        value: String(item.menuId),
        label: item.menuName,
        level: depth,
        path: currentPath,
        parentId: String(parentId),
        disabled: item.menuType === 'F',
        menuType: item.menuType,
      });
      if (item.children && item.children.length > 0) {
        walk(item.children, depth + 1, currentPath, item.menuId);
      }
    });
  };

  walk(nodes, 1, [], 0);
  return options;
}

export function filterParentOptions(
  options: MenuParentOption[],
  excludeIds: Set<number>,
): MenuParentOption[] {
  if (!excludeIds || excludeIds.size === 0) {
    return options;
  }
  let changed = false;
  const filtered = options.filter((option) => {
    if (option.value === '0') {
      return true;
    }
    const id = Number(option.value);
    if (!Number.isFinite(id)) {
      return true;
    }
    const shouldKeep = !excludeIds.has(id);
    if (!shouldKeep) {
      changed = true;
    }
    return shouldKeep;
  });
  return changed ? filtered : options;
}

export function collectDescendantIds(node?: MenuTreeNode): number[] {
  if (!node?.children) return [];
  const result: number[] = [];
  const stack = [...node.children];
  while (stack.length > 0) {
    const current = stack.pop()!;
    result.push(current.menuId);
    if (current.children) {
      stack.push(...current.children);
    }
  }
  return result;
}

export function findMenuNodeById(
  nodes: MenuTreeNode[],
  menuId: number,
): MenuTreeNode | null {
  for (const node of nodes) {
    if (node.menuId === menuId) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      const found = findMenuNodeById(node.children, menuId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export function reorderTree(
  nodes: MenuTreeNode[],
  parentId: number,
  orderedIds: number[],
): MenuTreeNode[] {
  if (parentId === 0) {
    const map = new Map(nodes.map((node) => [node.menuId, node]));
    return orderedIds
      .map((id, index) => {
        const current = map.get(id);
        if (!current) return null;
        return {
          ...current,
          orderNum: index + 1,
          children: current.children ? [...current.children] : undefined,
        };
      })
      .filter(Boolean) as MenuTreeNode[];
  }

  return nodes.map((node) => {
    if (node.menuId === parentId) {
      const childMap = new Map(
        (node.children ?? []).map((child) => [child.menuId, child]),
      );
      const newChildren = orderedIds
        .map((id, index) => {
          const current = childMap.get(id);
          if (!current) return null;
          return {
            ...current,
            orderNum: index + 1,
            children: current.children ? [...current.children] : undefined,
          };
        })
        .filter(Boolean) as MenuTreeNode[];
      return {
        ...node,
        children: newChildren,
      };
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: reorderTree(node.children, parentId, orderedIds),
      };
    }
    return node;
  });
}

export function getNextOrderNum(nodes: MenuTreeNode[], parentId: number) {
  const siblings =
    parentId === 0
      ? nodes
      : (findMenuNodeById(nodes, parentId)?.children ?? []);
  if (!siblings || siblings.length === 0) {
    return 1;
  }
  const maxOrder = siblings.reduce(
    (max, item) => Math.max(max, item.orderNum ?? 0),
    0,
  );
  return maxOrder + 1;
}

const normalizeRouteSegment = (value: string) =>
  value
    .trim()
    .replace(/^[\\/]+/, '')
    .replace(/[\\/]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

export function buildRouteSlug(
  path: string,
  fallback: string,
  defaultValue = 'route',
) {
  const fromPath = normalizeRouteSegment(path);
  if (fromPath.length > 0) {
    return fromPath;
  }
  const fromFallback = normalizeRouteSegment(fallback);
  if (fromFallback.length > 0) {
    return fromFallback;
  }
  return defaultValue;
}
