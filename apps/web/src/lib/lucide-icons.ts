import type { LucideIcon, LucideProps } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { createElement, forwardRef } from 'react';

const RESERVED_EXPORTS = new Set([
  'default',
  'icons',
  'createLucideIcon',
  'LucideIcon',
  'IconNode',
  'Icon',
]);

export type LucideIconEntry = {
  value: string;
  label: string;
  search: string;
  Icon: LucideIcon;
};

const ICON_ENTRIES: LucideIconEntry[] = Object.entries(LucideIcons)
  .filter(([name, component]) => isLucideComponent(name, component))
  .map(([name, component]) => {
    const label = humanizeIconName(name);
    return {
      value: name,
      label,
      search: `${name} ${label} ${slugifyName(name)}`.toLowerCase(),
      Icon: component as LucideIcon,
    };
  })
  .sort((a, b) => a.value.localeCompare(b.value));

const ICON_MAP = new Map(
  ICON_ENTRIES.map((entry) => [entry.value.toLowerCase(), entry]),
);
const NullIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, strokeWidth = 2, ...rest }, ref) =>
    createElement('svg', {
      ref,
      width: size,
      height: size,
      stroke: 'currentColor',
      strokeWidth,
      fill: 'none',
      'aria-hidden': true,
      focusable: 'false',
      ...rest,
    }),
);
NullIcon.displayName = 'NullIcon';

const fallbackIcon: LucideIcon =
  (LucideIcons.MenuSquare as LucideIcon | undefined) ?? NullIcon;

function isLucideComponent(
  name: string,
  component: unknown,
): component is LucideIcon {
  if (!name || RESERVED_EXPORTS.has(name)) {
    return false;
  }
  if (name.endsWith('Icon')) {
    return false;
  }
  if (
    !component ||
    (typeof component !== 'object' && typeof component !== 'function')
  ) {
    return false;
  }
  return true;
}

function humanizeIconName(name: string) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

function slugifyName(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

export function resolveLucideIcon(name?: string | null): LucideIcon {
  if (!name) {
    return fallbackIcon;
  }
  const normalized = name.trim().toLowerCase();
  return ICON_MAP.get(normalized)?.Icon ?? fallbackIcon;
}

export function getLucideIconEntries(): LucideIconEntry[] {
  return ICON_ENTRIES;
}
