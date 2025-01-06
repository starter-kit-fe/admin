import { IApp } from '@/app/(mian)/_type';
import { createColumnHelper } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import Show from '@/components/show';

const columnHelper = createColumnHelper<IApp.asObject>();

const defaultColumns = [
  columnHelper.accessor('name', {
    cell: ({ getValue }) => <div className="text-left">{getValue()}</div>,
  }),
  columnHelper.accessor('version', {
    cell: ({ getValue }) => <div className="text-left">{getValue()}</div>,
  }),
  columnHelper.accessor('lastVersion', {
    cell: ({ getValue, row }) => (
      <div className="text-left">
        {getValue()}
        <Show when={row.original.isNeedUpdate}>
          <Badge
            className="ml-2"
            variant={row.original.isNeedUpdate ? 'destructive' : 'default'}
          >
            需要更新
          </Badge>
        </Show>
      </div>
    ),
  }),
];
export default defaultColumns;
