import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending: boolean;
};

export function DeleteAccountDialog({
  open,
  onOpenChange,
  onConfirm,
  pending,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="privacy-delete-confirm">
        <DialogHeader>
          <DialogTitle>Request account deletion?</DialogTitle>
          <DialogDescription>
            Your account will be marked for deletion. You have 30 days to
            cancel from the Privacy page before the row is anonymised. Past
            orders stay in our records but are stripped of personally
            identifying fields.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            data-testid="privacy-delete-confirm-submit"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? 'Scheduling…' : 'Yes, schedule deletion'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
