import { QueryProvider } from "./query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: React.PropsWithChildren) {
  return (
    <QueryProvider>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster position="top-right" richColors />
    </QueryProvider>
  );
}
