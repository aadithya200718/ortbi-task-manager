'use client';

import React, { useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DialogProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Dialog({ isOpen, open, onClose, onOpenChange, title, description, children, maxWidth = 'md' }: DialogProps) {
  const isVisible = open ?? Boolean(isOpen);
  const handleClose = useCallback(() => {
    onOpenChange?.(false);
    onClose?.();
  }, [onClose, onOpenChange]);

  useEffect(() => {
    if (!isVisible) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose, isVisible]);

  if (!isVisible) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button className="fade-in absolute inset-0 cursor-default bg-black/70" onClick={handleClose} aria-label="Close dialog" />
      <div className={cn('modal-scale-in relative z-10 max-h-[88dvh] w-full overflow-y-auto rounded-xl border border-white/[0.09] bg-[#151517] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:p-6', widths[maxWidth])}>
        <div className="flex items-start justify-between gap-6 border-b border-white/[0.07] pb-4">
          <div>
            <h2 id="dialog-title" className="text-base font-semibold tracking-[-0.015em] text-white">{title}</h2>
            {description ? <p className="mt-1 max-w-[44ch] text-xs leading-5 text-[#8b8b94]">{description}</p> : null}
          </div>
          <button onClick={handleClose} className="focus-ring -mr-1 rounded-md p-1.5 text-[#71717A] transition-colors hover:bg-white/[0.05] hover:text-white" aria-label="Close dialog">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}
