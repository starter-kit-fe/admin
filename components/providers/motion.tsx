'use client';

import { LazyMotion, domMax } from 'motion/react';
export const MotionProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <LazyMotion features={domMax} strict key="framer">
      {children}
    </LazyMotion>
  );
};
