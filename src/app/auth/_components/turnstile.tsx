import Turnstile, { useTurnstile, BoundTurnstileObject } from 'react-turnstile';
import { useTheme } from 'next-themes';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type OnVerify =
  | ((token: string, boundTurnstile: BoundTurnstileObject) => void)
  | undefined;

const LOADING_CLASS =
  'text-sm flex text-muted-foreground items-center transition-opacity duration-300';
const LOADED_CLASS =
  'text-sm flex text-muted-foreground items-center opacity-0 hidden transition-opacity duration-300';

const TURNSTILE_CLASS = 'transition-opacity duration-300';

export default function Page({ onVerify }: { onVerify: OnVerify }) {
  const turnstile = useTurnstile();
  const { theme } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);

  const handleOnLoad = () => setIsLoaded(true);

  const handleOnError = (err: Error) => {
    console.error('Turnstile error:', err);
    // turnstile.reset(); // Optional: Reset the Turnstile on error
  };

  const handleOnTimeout = () => {
    turnstile.reset();
  };

  const handleOnExpire = () => {
    turnstile.reset();
  };

  return (
    <>
      <div className={cn(isLoaded ? LOADED_CLASS : LOADING_CLASS)}>
        <Loader2 className="animate-spin mr-1" />
        <span>加载中...</span>
      </div>
      <Turnstile
        className={cn(
          isLoaded ? TURNSTILE_CLASS : 'opacity-0',
          TURNSTILE_CLASS
        )}
        style={{
          maxHeight: '65px',
          width: '100%',
        }}
        onLoad={handleOnLoad}
        retry="never"
        theme={theme === 'system' ? 'auto' : (theme as 'light' | 'dark')}
        sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onVerify={onVerify}
        onError={handleOnError}
        onTimeout={handleOnTimeout}
        onExpire={handleOnExpire}
      />
    </>
  );
}
