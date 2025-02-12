'use client';
import { useQuery } from '@tanstack/react-query';
import { getGroups } from '../_api';
import { useStore } from '../_store';
import { ID_LOOKUP_GROUP } from '@/lib/constant';
import ShowWithLoading from '@/components/loading-show';
import ShowWithEmpty from '@/components/loading-empty';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';

export default function Page() {
  const { groupParams, setState } = useStore();
  const params = {
    ...groupParams,
    status: groupParams.status === 'all' ? '' : groupParams.status,
  };
  const { isLoading, data, isSuccess } = useQuery({
    queryKey: [ID_LOOKUP_GROUP],
    queryFn: () => getGroups(params),
  });
  useEffect(() => {
    if (isSuccess && data?.list.length > 0) {
      setState('currentGroup', data.list[0]);
    }
  }, [isSuccess, data, setState]);
  return (
    <ShowWithLoading when={!isLoading}>
      <ShowWithEmpty when={!!data?.list?.length}>
        <div className="rounded-sm gap-1 flex flex-col items-start">
          {data?.list.map((it) => (
            <Button
              className="w-full flex justify-between items-center"
              key={it.value}
              variant="ghost"
              onClick={() => setState('currentGroup', it)}
            >
              <span>{it.value}</span>
              <Badge variant="outline">{it.total}</Badge>
            </Button>
          ))}
        </div>
      </ShowWithEmpty>
    </ShowWithLoading>
  );
}
