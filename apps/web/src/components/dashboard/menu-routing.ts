import type { MenuNode } from '@/types';

function parsePathSegments(path?: string | null): string[] {
  if (!path) {
    return [];
  }
  return path
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment, index, segments) => {
      if (index !== segments.length - 1) {
        return true;
      }
      return segment.toLowerCase() !== 'index';
    });
}

function composeSegments(
  parentSegments: string[],
  currentPath?: string | null,
) {
  const parent = parentSegments;
  const current = parsePathSegments(currentPath);
  if (current.length === 0) {
    return parent;
  }

  const isExplicitAbsolute = Boolean(
    currentPath && currentPath.startsWith('/'),
  );
  const isCurrentAbsolute =
    !isExplicitAbsolute &&
    parent.length > 0 &&
    current.length >= parent.length &&
    parent.every((segment, index) => current[index] === segment);

  if (isExplicitAbsolute || isCurrentAbsolute) {
    return current;
  }

  return [...parent, ...current];
}

function buildDashboardUrl(segments: string[]): string {
  if (segments.length === 0) {
    return '/dashboard';
  }

  if (segments[0] === 'dashboard') {
    return `/${segments.join('/')}`;
  }

  return `/dashboard/${segments.join('/')}`;
}

export function isExternalMenu(menu: MenuNode): boolean {
  const path = menu.path ?? '';
  const link = menu.meta?.link ?? '';
  return /^https?:\/\//.test(path) || /^https?:\/\//.test(link ?? '');
}

export function resolveMenuLink(menu: MenuNode, parentSegments: string[]) {
  if (isExternalMenu(menu)) {
    const link = menu.meta?.link?.trim();
    const path = (menu.path ?? '').trim();
    return {
      url: link || path || '#',
      segments: parentSegments,
      external: true,
    };
  }

  const segments = composeSegments(parentSegments, menu.path);
  return {
    url: buildDashboardUrl(segments),
    segments,
    external: false,
  };
}

export type MenuLink = {
  node: MenuNode;
  url: string;
  external: boolean;
  segments: string[];
};

export function collectVisibleLeaves(
  nodes?: MenuNode[],
  parentSegments: string[] = [],
): MenuLink[] {
  if (!nodes) {
    return [];
  }
  return nodes
    .filter((node) => !node.hidden)
    .flatMap((node) => {
      const { url, segments, external } = resolveMenuLink(node, parentSegments);

      if (node.children && node.children.length > 0) {
        const nextSegments = external ? parentSegments : segments;
        const leaves = collectVisibleLeaves(node.children, nextSegments);
        if (leaves.length > 0) {
          return leaves;
        }
      }

      return [
        {
          node,
          url,
          external,
          segments,
        },
      ];
    });
}

export function buildMenuCacheMap(
  nodes: MenuNode[],
  parentSegments: string[] = [],
  cache = new Map<string, boolean>(),
): Map<string, boolean> {
  nodes
    .filter((node) => !node.hidden)
    .forEach((node) => {
      const { url, external, segments } = resolveMenuLink(node, parentSegments);
      if (!external) {
        const cacheable = !(node.meta?.noCache ?? false);
        cache.set(url, cacheable);
      }
      if (node.children && node.children.length > 0) {
        const nextSegments = external ? parentSegments : segments;
        buildMenuCacheMap(node.children, nextSegments, cache);
      }
    });

  return cache;
}

export { buildDashboardUrl };
