'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({ className, variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }: ButtonProps) {
  const variants = {
    primary: 'border-[#6b7aff] bg-[#5B6CFF] text-white hover:bg-[#6878ff]',
    secondary: 'border-white/[0.08] bg-[#171719] text-[#F5F5F4] hover:bg-[#1d1d20]',
    outline: 'border-white/[0.1] bg-transparent text-[#A1A1AA] hover:border-white/[0.16] hover:bg-white/[0.035] hover:text-white',
    ghost: 'border-transparent bg-transparent text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white',
    danger: 'border-rose-500/25 bg-rose-500/[0.08] text-rose-300 hover:bg-rose-500/[0.14]',
  };
  const sizes = {
    sm: 'h-8 gap-1.5 px-3 text-xs',
    md: 'h-9 gap-2 px-3.5 text-sm',
    lg: 'h-10 gap-2 px-4 text-sm',
  };

  return (
    <button
      className={cn(
        'interactive-press focus-ring inline-flex items-center justify-center rounded-lg border font-medium transition-[background-color,border-color,color,transform,opacity] duration-[var(--motion-fast)] disabled:pointer-events-none disabled:opacity-45',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className="loading-spinner h-3.5 w-3.5" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
