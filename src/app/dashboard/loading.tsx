'use client';
// src/components/LoadingSpinner.js
import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="h-full w-full text-sm text-muted-foreground text-center min-h-[10svh] flex justify-center items-center">
      <Loader2 className="animate-spin mr-2" /> 加载中...
    </div>
  );
};

export default LoadingSpinner;
