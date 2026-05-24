import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './dialog';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  /** Confirm-button label. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Cancel-button label. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Render the confirm button in the destructive variant + warning icon. */
  destructive?: boolean;
  /** Hide the confirm button (busy state). */
  isPending?: boolean;
  onConfirm: () => void;
}

/**
 * Shared confirmation pattern. Replaces inline `confirm()` calls and
 * one-off Dialog wiring for destructive actions (deactivate user,
 * reject driver, delete provider). On destructive=true the icon goes
 * red and the confirm button uses the destructive variant so admins
 * don't fat-finger a "Deactivate" the same way they'd dismiss a "Save".
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  isPending = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-3">
            {destructive && (
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive"
                aria-hidden="true"
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1.5">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Please wait…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
