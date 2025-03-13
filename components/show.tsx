interface showProps {
  when: boolean;
  fallback?: React.ReactNode;
}
export default function Show({
  children,
  when,
  fallback = null,
}: React.PropsWithChildren<showProps>) {
  return when ? children : fallback;
}
