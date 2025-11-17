'use client';

import { LogoMark } from '@/components/logo-mark';
import { motion } from 'framer-motion';

export default function Page() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">
      <motion.div
        className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm"
        initial={{ opacity: 0, scale: 0.96, filter: 'blur(2px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/35"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, ease: 'linear', repeat: Infinity }}
        />
        <motion.div
          className="pointer-events-none absolute inset-[5px] rounded-xl border border-primary/25"
          animate={{
            opacity: [0.35, 0.8, 0.35],
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity }}
        />
        <LogoMark
          className="h-11 w-11 text-primary drop-shadow-[0_6px_16px_hsl(var(--primary)_/_0.3)]"
          gradientIdPrefix="app-loading-logo"
        />
        <span className="sr-only">Loading dashboard</span>
      </motion.div>
    </div>
  );
}
