import ShowWithLoading from '@/components/loading-show';
import ShowWithEmpty from '@/components/loading-empty';
import { getList } from '../_api';
import { useQuery } from '@tanstack/react-query';
import { ID_LOOKUP_LIST } from '@/lib/constant';
import { useStore } from '../_store';
import Table from './table';
export default function Page() {
  const { currentGroup, listParams } = useStore();
  const params = {
    ...listParams,
    status: listParams.status === 'all' ? '' : listParams.status,
  };
  const { isLoading, data } = useQuery({
    queryKey: [ID_LOOKUP_LIST, currentGroup, params],
    queryFn: () => getList(currentGroup?.value!, params),
    enabled: Boolean(currentGroup),
  });
  console.log(data);
  return (
    <ShowWithLoading when={!isLoading}>
      <ShowWithEmpty when={!!data?.list}>
        <Table data={data?.list} />
      </ShowWithEmpty>
    </ShowWithLoading>
  );
}
