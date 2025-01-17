import Show from '@/components/show';
import Loading from '@/components/loading';
interface LoadingShowProps {
  when: boolean;
}
export default function Page({
  when,
  children,
}: React.PropsWithChildren<LoadingShowProps>) {
  return (
    <Show when={when} fallback={<Loading />}>
      {children}
    </Show>
  );
}
