import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';

type ConfirmProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ActivateConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: ConfirmProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent data-testid="storage-activate-confirm">
        <DialogHeader>
          <DialogTitle>Activate without testing?</DialogTitle>
          <DialogDescription>
            This provider hasn&apos;t been tested in this session. Bad
            credentials will break new uploads immediately. Run a test first or
            activate anyway.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            data-testid="storage-activate-confirm-submit"
            onClick={onConfirm}
          >
            Activate anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: ConfirmProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent data-testid="storage-delete-confirm">
        <DialogHeader>
          <DialogTitle>Delete this provider?</DialogTitle>
          <DialogDescription>
            This action is permanent. The backend will refuse the delete if any
            document still references this provider, or if it is the active
            one.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            data-testid="storage-delete-confirm-submit"
            variant="destructive"
            onClick={onConfirm}
          >
            Delete provider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
