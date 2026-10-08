'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-elevated/80 border border-border/50 motion-reduce:animate-none',
        className,
      )}
    />
  );
}
