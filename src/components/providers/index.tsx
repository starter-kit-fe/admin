import { ThemeProvider } from './theme';
import { QueryProvider } from './query';
import { AuthorizationProvider } from './authorization';
export default function Page({ children }: React.PropsWithChildren) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthorizationProvider>{children}</AuthorizationProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
