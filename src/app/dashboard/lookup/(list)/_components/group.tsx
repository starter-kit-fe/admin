'use client';
import { ILookUP } from '../../_type';
import Show from '@/components/show';
import { Button } from '@/components/ui/button';
import Empty from '@/components/empty';
import { useStore } from '../_store';
interface GroupProps {
  data: ILookUP.listGroupResponse;
}
export default function Page({ data }: GroupProps) {
  const { currentGroup, setCurrentGroup } = useStore();

  const groupButtons = data.list?.map((group) => (
    <Button
      key={group.value}
      variant={currentGroup?.value === group.value ? 'secondary' : 'ghost'}
      className={`text-muted-foreground w-full justify-between mb-1 text-sm ${
        currentGroup?.value === group.value ? ' text-black' : ''
      }`}
      size="sm"
      onClick={() => setCurrentGroup(group)}
    >
      <span>{group.value.toUpperCase()}</span>
      <span>{group.total}</span>
    </Button>
  ));

  return (
    <Show when={Boolean(data?.list?.length)} fallback={<Empty />}>
      {groupButtons}
    </Show>
  );
}
