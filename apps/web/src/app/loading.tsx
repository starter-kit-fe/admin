'use client';

import { LogoMark } from '@/components/logo-mark';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

// --- 1. Hardcoded Content ---
// All multilingual logic has been replaced with this simple object.
const copy = {
  title: 'Initializing Your Experience',
  subtitle: 'Just a moment while we get things ready for you.',
  steps: [
    'Loading assets...',
    'Establishing secure connection...',
    'Preparing dashboard...',
    'Finalizing setup...',
  ],
};

const TEXT_CHANGE_INTERVAL = 2000; // ms

export default function Page() {
  // We can still use useMemo for consistency, though it's no longer strictly necessary
  const steps = useMemo(
    () => (Array.isArray(copy.steps) ? copy.steps : []),
    [],
  );

  // --- 2. State Management for Text Animation ---
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (steps.length <= 1) return;

    // Set up a timer to cycle through the loading steps
    const timer = setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, TEXT_CHANGE_INTERVAL);

    // Clean up the timer when the component is unmounted
    return () => clearInterval(timer);
  }, [steps]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
      <motion.div
        className="flex w-full max-w-sm flex-col items-center gap-8 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {/* Pulsing Logo */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }}
          transition={{
            duration: 2.5,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        >
          <LogoMark
            className="h-16 w-16 text-primary drop-shadow-[0_8px_20px_hsl(var(--primary)_/_0.25)]"
            gradientIdPrefix="app-loading-logo"
          />
        </motion.div>

        {/* Text Content */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-semibold">{copy.title}</p>
          <p className="text-base text-muted-foreground">{copy.subtitle}</p>
          <div className="h-6 text-sm text-primary">
            <AnimatePresence mode="wait">
              <motion.p
                key={activeStep}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                {steps.length > 0 ? steps[activeStep] : ''}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs pt-4">
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-primary/10">
            <motion.div
              key={activeStep}
              className="absolute left-0 top-0 h-full rounded-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: TEXT_CHANGE_INTERVAL / 1000,
                ease: 'linear',
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
