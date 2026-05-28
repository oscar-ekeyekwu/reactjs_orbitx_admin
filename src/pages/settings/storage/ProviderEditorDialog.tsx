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
import type { ProviderFormDraft } from './types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  draft: ProviderFormDraft;
  setDraft: React.Dispatch<React.SetStateAction<ProviderFormDraft>>;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  errorMessage: string | null;
};

export function ProviderEditorDialog({
  open,
  onOpenChange,
  editingId,
  draft,
  setDraft,
  onSubmit,
  submitting,
  errorMessage,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingId ? 'Edit provider' : 'Add storage provider'}
          </DialogTitle>
          <DialogDescription>
            Credentials are encrypted at rest via the platform&apos;s
            STORAGE_KEK before they touch the database.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={onSubmit}
          className="space-y-3"
          data-testid="storage-editor-form"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="prov-slug">
                Slug{editingId ? ' (immutable)' : ''}
              </Label>
              <Input
                id="prov-slug"
                data-testid="storage-form-slug"
                value={draft.slug}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, slug: e.target.value }))
                }
                placeholder="supabase-eu-central"
                disabled={!!editingId}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prov-display">Display name</Label>
              <Input
                id="prov-display"
                data-testid="storage-form-displayName"
                value={draft.displayName}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, displayName: e.target.value }))
                }
                placeholder="Supabase Storage (EU Central)"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="prov-endpoint">Endpoint</Label>
            <Input
              id="prov-endpoint"
              data-testid="storage-form-endpoint"
              value={draft.endpoint}
              onChange={(e) =>
                setDraft((d) => ({ ...d, endpoint: e.target.value }))
              }
              placeholder="https://abc.supabase.co/storage/v1/s3"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="prov-region">Region</Label>
              <Input
                id="prov-region"
                data-testid="storage-form-region"
                value={draft.region}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, region: e.target.value }))
                }
                placeholder="eu-central-1"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prov-bucket">Bucket</Label>
              <Input
                id="prov-bucket"
                data-testid="storage-form-bucket"
                value={draft.bucket}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, bucket: e.target.value }))
                }
                placeholder="kyc-v1"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="prov-key">Access key ID</Label>
            <Input
              id="prov-key"
              data-testid="storage-form-accessKeyId"
              value={draft.accessKeyId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, accessKeyId: e.target.value }))
              }
              placeholder="AKIAIOSFODNN7EXAMPLE"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="prov-secret">
              Secret access key{' '}
              {editingId ? '(leave blank to keep current)' : ''}
            </Label>
            <Input
              id="prov-secret"
              data-testid="storage-form-secretAccessKey"
              type="password"
              value={draft.secretAccessKey}
              onChange={(e) =>
                setDraft((d) => ({ ...d, secretAccessKey: e.target.value }))
              }
              placeholder={
                editingId
                  ? '••••••••  (keep current)'
                  : 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
              }
              required={!editingId}
            />
          </div>

          {errorMessage && (
            <p
              data-testid="storage-form-error"
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
              data-testid="storage-form-submit"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
