'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ className, label, error, hint, id, rows = 3, ...props }: TextareaProps) {
  const textareaId = id || props.name;
  const errorId = textareaId ? `${textareaId}-error` : undefined;
  return (
    <div className="w-full space-y-1.5">
      {label ? (
        <div className="flex items-center justify-between gap-4">
          <label htmlFor={textareaId} className="block text-xs font-medium text-[#C4C4CA]">{label}</label>
          {hint ? <span className="text-[11px] text-[#71717A]">{hint}</span> : null}
        </div>
      ) : null}
      <textarea
        id={textareaId}
        rows={rows}
        className={cn('field-control min-h-24 w-full resize-none py-2.5 text-[#F5F5F4] placeholder:text-[#64646d]', error ? 'border-rose-500/70' : '', className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error ? <p id={errorId} className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
