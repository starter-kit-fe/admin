'use client';

import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  processingLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  processingLabel,
  loading,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const t = useTranslations('Common.dialogs');
  const resolvedCancel = cancelLabel ?? t('cancel');
  const resolvedConfirm = confirmLabel ?? t('confirm');
  const resolvedProcessing = processingLabel ?? t('processing');

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Content className="sm:max-w-md">
        <ResponsiveDialog.Header>
          <ResponsiveDialog.Title>{title}</ResponsiveDialog.Title>
          <ResponsiveDialog.Description>{description}</ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <ResponsiveDialog.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {resolvedCancel}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? resolvedProcessing : resolvedConfirm}
          </Button>
        </ResponsiveDialog.Footer>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}
