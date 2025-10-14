import { ThemeProvider } from "./theme";
import { QueryProvider } from "./query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: React.PropsWithChildren) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </QueryProvider>
  );
}
