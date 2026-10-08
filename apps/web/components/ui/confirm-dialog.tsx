'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';
import { Dialog } from './dialog';

export interface ConfirmDialogProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  message?: string;
  warningText?: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  isLoading?: boolean;
}

export function ConfirmDialog({ isOpen, open, onClose, onOpenChange, onConfirm, title, description, message, warningText, confirmText, confirmLabel = 'Delete', cancelLabel = 'Cancel', variant = 'danger', isLoading = false }: ConfirmDialogProps) {
  const isVisible = open ?? Boolean(isOpen);
  const handleClose = () => {
    onOpenChange?.(false);
    onClose?.();
  };
  return (
    <Dialog isOpen={isVisible} onClose={handleClose} title={title} maxWidth="sm">
      <div className="space-y-4">
        {warningText ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.07] p-3 text-xs leading-5 text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
            <p>{warningText}</p>
          </div>
        ) : null}
        <p className="text-sm leading-6 text-[#A1A1AA]">{description || message || 'Are you sure you want to continue?'}</p>
        <div className="flex justify-end gap-2 border-t border-white/[0.07] pt-4">
          <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isLoading}>{cancelLabel}</Button>
          <Button type="button" variant={variant === 'danger' ? 'danger' : 'primary'} size="sm" onClick={onConfirm} isLoading={isLoading}>{confirmText || confirmLabel}</Button>
        </div>
      </div>
    </Dialog>
  );
}
