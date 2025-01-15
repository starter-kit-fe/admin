'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { IPermissions } from '../../../_types';
import { Button } from '@/components/ui/button';
import Show from '@/components/show';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatISOTime } from '@/lib/format-ios-time';
import { Badge } from '@/components/ui/badge';
import Actions from './actions';
import StatusSwitch from './status-switch';
import { IconCard } from '@/app/dashboard/permissions/create/_components/icon/card';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
const columnHelper = createColumnHelper<IPermissions.TreeNode>();
export const columns = [
  columnHelper.accessor('name', {
    header: () => <span>名称</span>,
    cell: ({ row, getValue }) => (
      <div
        className="flex items-center gap-1"
        style={{
          // Since rows are flattened by default,
          // we can use the row.depth property
          // and paddingLeft to visually indicate the depth
          // of the row
          paddingLeft: `${row.depth * 2}rem`,
        }}
      >
        <Show when={row.getCanExpand()}>
          <Button
            variant="ghost"
            className="h-[24px] w-[24px]"
            size="sm"
            onClick={row.getToggleExpandedHandler()}
          >
            <Show when={row.getIsExpanded()} fallback={<ChevronRight />}>
              <ChevronDown />
            </Show>
          </Button>
        </Show>
        {getValue()}
      </div>
    ),
  }),
  columnHelper.accessor('icon', {
    header: () => <span>图标</span>,
    cell: ({ getValue }) => (
      <Show when={!!getValue()}>
        <IconCard iconName={getValue() as keyof typeof dynamicIconImports} />
      </Show>
    ),
  }),
  columnHelper.accessor('perms', {
    header: () => <span>权限</span>,
    cell: ({ getValue }) => <span>{getValue()}</span>,
  }),
  columnHelper.accessor('type', {
    header: () => <span>类型</span>,
    cell: ({ getValue }) => <Badge variant="outline">{getValue().label}</Badge>,
  }),

  columnHelper.accessor('path', {
    header: () => <span>路由</span>,
    cell: ({ getValue }) => <span>{getValue()}</span>,
  }),

  columnHelper.accessor('status', {
    header: () => <span>状态</span>,
    cell: ({ getValue, row }) => {
      return <StatusSwitch id={row.original.id} status={getValue().id} />;
    },
  }),
  columnHelper.accessor('updatedAt', {
    header: () => <span>更新时间</span>,
    cell: ({ getValue }) => <span>{formatISOTime(getValue())}</span>,
  }),
  columnHelper.accessor('children', {
    header: () => <span>操作</span>,
    cell: ({ row }) => (
      <Actions id={row.original.id} name={row.original.name} />
    ),
  }),
];
