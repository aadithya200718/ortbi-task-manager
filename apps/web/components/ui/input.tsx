'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ className, label, error, hint, id, type = 'text', ...props }: InputProps) {
  const inputId = id || props.name;
  const errorId = inputId ? `${inputId}-error` : undefined;
  return (
    <div className="w-full space-y-1.5">
      {label ? (
        <div className="flex items-center justify-between gap-4">
          <label htmlFor={inputId} className="block text-xs font-medium text-[#C4C4CA]">{label}</label>
          {hint ? <span className="text-[11px] text-[#71717A]">{hint}</span> : null}
        </div>
      ) : null}
      <input
        id={inputId}
        type={type}
        className={cn('field-control w-full text-[#F5F5F4] placeholder:text-[#64646d] disabled:cursor-not-allowed disabled:opacity-50', error ? 'border-rose-500/70' : '', className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error ? <p id={errorId} className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
