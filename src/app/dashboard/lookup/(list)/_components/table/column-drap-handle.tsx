import { useSortable } from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';

export default function Page({ rowId }: { rowId: string }) {
  const { attributes, listeners } = useSortable({
    id: rowId,
  });
  return (
    // Alternatively, you could set these attributes on the rows themselves
    <div className="w-[40px] cursor-move" {...attributes} {...listeners}>
      <GripVertical className="h-4 w-4 text-gray-400" />
    </div>
  );
}
