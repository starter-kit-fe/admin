import { ThemeProvider } from './theme';
import { QueryProvider } from './query';

export default function Page({ children }: React.PropsWithChildren) {
  return (
    <QueryProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryProvider>
  );
}
