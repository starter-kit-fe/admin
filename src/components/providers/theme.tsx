'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
// import { ProgressBar, ProgressBarProvider } from 'react-transition-progress';

export function ThemeProvider({ children }: React.PropsWithChildren) {
  return (
    // <ProgressBarProvider>
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      {/* <ProgressBar className="fixed h-1 shadow-lg shadow-sky-500/20 bg-black top-0" /> */}
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster position="top-right" richColors />
    </NextThemesProvider>
    // </ProgressBarProvider>
  );
}
