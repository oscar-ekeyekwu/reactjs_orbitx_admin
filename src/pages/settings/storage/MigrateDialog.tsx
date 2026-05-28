import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/components/ui';
import type { StorageProvider } from '@/services/api';
import type { MigrateFormDraft } from './types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providers: StorageProvider[];
  draft: MigrateFormDraft;
  setDraft: React.Dispatch<React.SetStateAction<MigrateFormDraft>>;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  errorMessage: string | null;
};

export function MigrateDialog({
  open,
  onOpenChange,
  providers,
  draft,
  setDraft,
  onSubmit,
  submitting,
  errorMessage,
}: Props) {
  const submitDisabled =
    submitting ||
    !draft.fromProviderId ||
    !draft.toProviderId ||
    draft.fromProviderId === draft.toProviderId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="storage-migrate-modal">
        <DialogHeader>
          <DialogTitle>Migrate documents</DialogTitle>
          <DialogDescription>
            Streams every KYC document from the source provider to the
            destination, anchored at queue time so uploads landing after this
            point are NOT picked up.
          </DialogDescription>
        </DialogHeader>

        <form
          data-testid="storage-migrate-form"
          onSubmit={onSubmit}
          className="space-y-3"
        >
          <div className="space-y-1">
            <Label htmlFor="migrate-from">Source provider</Label>
            <select
              id="migrate-from"
              data-testid="storage-migrate-from"
              value={draft.fromProviderId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, fromProviderId: e.target.value }))
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              required
            >
              <option value="" disabled>
                Select source…
              </option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName} ({p.slug})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="migrate-to">Destination provider</Label>
            <select
              id="migrate-to"
              data-testid="storage-migrate-to"
              value={draft.toProviderId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, toProviderId: e.target.value }))
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              required
            >
              <option value="" disabled>
                Select destination…
              </option>
              {providers
                .filter((p) => p.id !== draft.fromProviderId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName} ({p.slug})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="migrate-batch">Batch size (1–200)</Label>
              <Input
                id="migrate-batch"
                data-testid="storage-migrate-batch"
                type="number"
                min={1}
                max={200}
                value={draft.batchSize}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    batchSize: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="migrate-since">Since (optional)</Label>
              <Input
                id="migrate-since"
                data-testid="storage-migrate-since"
                type="date"
                value={draft.since}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, since: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3">
            <input
              id="migrate-dry-run"
              data-testid="storage-migrate-dry-run"
              type="checkbox"
              checked={draft.dryRun}
              onChange={(e) =>
                setDraft((d) => ({ ...d, dryRun: e.target.checked }))
              }
              className="mt-1 h-4 w-4"
            />
            <div className="space-y-0.5">
              <Label htmlFor="migrate-dry-run" className="cursor-pointer">
                Dry run
              </Label>
              <p className="text-xs text-muted-foreground">
                When on, the worker only verifies the source object exists and
                is readable. No writes to the destination. Recommended for
                first runs.
              </p>
            </div>
          </div>

          {errorMessage && (
            <p
              data-testid="storage-migrate-error"
              className="text-xs text-red-600"
            >
              {errorMessage}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-testid="storage-migrate-submit"
              disabled={submitDisabled}
            >
              {submitting ? 'Queuing…' : 'Start'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
