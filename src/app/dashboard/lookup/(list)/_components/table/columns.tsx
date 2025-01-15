'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { ILookUP } from '../../../_type';
import { DataTableColumnHeader } from './column-header';
import Action from './column-actions';
import Show from '@/components/show';
import StatusSwitch from './status-switch';
import { StatusMode } from './status-switch';
import CopyName from './copy-name';
const columnHelper = createColumnHelper<ILookUP.asObject>();

export const columns = [
  columnHelper.accessor('label', {
    header: '名称',
    cell: (it) => <CopyName value={it.getValue()} />,
  }),
  columnHelper.accessor('value', {
    header: '数据',
    cell: (it) => <CopyName value={it.getValue()} />,
  }),
  columnHelper.accessor('isDefault', {
    header: '默认',
    cell: ({ row, getValue }) => (
      <Show when={row.original.status !== 2}>
        <StatusSwitch
          mode={StatusMode.GROUP}
          checked={getValue() as boolean}
          id={row.original.id}
        />
      </Show>
    ),
  }),
  columnHelper.accessor('isActive', {
    header: '状态',
    cell: ({ row, getValue }) => {
      return (
        <StatusSwitch
          mode={StatusMode.STATUS}
          checked={getValue() as boolean}
          id={row.original.id}
        />
      );
    },
  }),
  columnHelper.accessor('creator', {
    header: '创建人',
    cell: (it) => it.getValue() || '-',
  }),
  columnHelper.accessor('updatedAt', {
    header: '更新时间',
    cell: (it) => it.getValue() || '-',
  }),
  columnHelper.display({
    id: 'action',
    cell: (it) => <Action row={it} />,
  }),
];
