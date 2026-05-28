import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import type { PaymentProvider } from '@/services/api';

type Props = {
  target: PaymentProvider | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
  pending: boolean;
};

export function DeleteConfirmDialog({
  target,
  onCancel,
  onConfirm,
  pending,
}: Props) {
  return (
    <Dialog open={!!target} onOpenChange={(o) => (o ? null : onCancel())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete payment provider?</DialogTitle>
          <DialogDescription>
            {target?.isActive
              ? 'This provider is currently active. Activate a different provider before deleting this one.'
              : `${target?.displayName ?? ''} will be removed and the action recorded in the audit log.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!target || target.isActive || pending}
            onClick={() => target && onConfirm(target.id)}
          >
            {pending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
