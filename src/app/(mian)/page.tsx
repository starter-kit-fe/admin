'use client';
import { getVersion } from '@/app/(mian)/_api';
import Loading from '@/components/loading';
import Show from '@/components/show';
import { useQuery } from '@tanstack/react-query';
import { formatISOTime } from '@/lib/format-ios-time';
export default function Page() {
  const { isLoading, data } = useQuery({
    queryKey: ['version'],
    queryFn: getVersion,
  });
  return (
    <div className="text-sm text-muted-foreground p-2">
      <Show when={!isLoading} fallback={<Loading />}>
        <div>server time:{formatISOTime(data?.now ?? '')}</div>
        <div>version: {data?.version}</div>
        <div>environment: {data?.environment}</div>
      </Show>
    </div>
  );
}
