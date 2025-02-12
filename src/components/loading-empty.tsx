import Show from '@/components/show';
import Empty from '@/components/empty';
interface LoadingShowProps {
  when: boolean;
}
export default function Page({
  when,
  children,
}: React.PropsWithChildren<LoadingShowProps>) {
  return (
    <Show when={when} fallback={<Empty />}>
      {children}
    </Show>
  );
}
