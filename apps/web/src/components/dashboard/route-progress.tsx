'use client';

//makes the component client so we can use hooks
import {usePathname} from '@/i18n/navigation';
import { useEffect, useState } from 'react';

export const RouteProgressBar = () => {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setProgress(40);
    setHidden(false);

    const timer = setTimeout(() => {
      setProgress(100);

      setTimeout(() => {
        setHidden(true);
        setProgress(0);
      }, 200);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className={`h-[2px] bg-primary fixed top-0 left-0 transition-all duration-300 shadow-2xl ${
        hidden ? 'opacity-0 w-0' : 'opacity-100 w-full z-[70]'
      }`}
      style={{
        width: `${progress}%`,
        transition: progress === 100 ? 'none' : 'width 0.3s ease-in-out',
      }}
    />
  );
};
