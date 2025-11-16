'use client';

import { LogoMark } from '@/components/logo-mark';
import { routing } from '@/i18n/routing';
import enCopy from '@/messages/en/Loading.json';
import zhCopy from '@/messages/zh-Hans/Loading.json';
import { useLocaleStore } from '@/stores/locale-store';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

export default function Page() {
  const { locale: storedLocale } = useLocaleStore();
  const resolvedLocale = useMemo(
    () => storedLocale ?? routing.defaultLocale,
    [storedLocale],
  );

  const copy = useMemo(() => {
    const map = {
      en: enCopy,
      'zh-Hans': zhCopy,
    } satisfies Record<string, typeof enCopy>;
    return map[resolvedLocale] ?? map[routing.defaultLocale] ?? enCopy;
  }, [resolvedLocale]);

  const steps = useMemo(
    () => (Array.isArray(copy.steps) ? copy.steps : []),
    [copy.steps],
  );

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (steps.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, 2000); // Increased interval for a calmer feel

    return () => clearInterval(timer);
  }, [steps]);

  return (
    <>
      <div className="flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
        <div className="flex max-w-sm flex-col items-center gap-8 text-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }}
            transition={{
              duration: 2,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          >
            <LogoMark
              className="h-16 w-16 text-primary drop-shadow-[0_8px_20px_hsl(var(--primary)_/_0.25)]"
              gradientIdPrefix="app-loading-logo"
            />
          </motion.div>

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
        </div>
      </div>
    </>
  );
}
