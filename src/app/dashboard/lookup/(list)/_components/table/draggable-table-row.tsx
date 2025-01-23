import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableRow } from '@/components/ui/table';
import { GripVertical } from 'lucide-react';

interface Props {
  id: string;
  children: React.ReactNode;
}

export function DraggableTableRow({ id, children }: Props) {
  const {
    attributes,
    listeners,
    transform,
    transition,
    setNodeRef,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <td className="w-[40px] cursor-move" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-gray-400" />
      </td>
      {children}
    </TableRow>
  );
}
