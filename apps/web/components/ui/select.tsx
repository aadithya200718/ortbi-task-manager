'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption { value: string; label: string; }
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export function Select({ className, label, error, options, id, ...props }: SelectProps) {
  const selectId = id || props.name;
  const errorId = selectId ? `${selectId}-error` : undefined;
  return (
    <div className="w-full space-y-1.5">
      {label ? <label htmlFor={selectId} className="block text-xs font-medium text-[#C4C4CA]">{label}</label> : null}
      <div className="relative">
        <select
          id={selectId}
          className={cn('field-control w-full appearance-none pr-9 text-[#F5F5F4]', error ? 'border-rose-500/70' : '', className)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...props}
        >
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#71717A]" strokeWidth={1.75} />
      </div>
      {error ? <p id={errorId} className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
