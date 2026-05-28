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
import type { PaymentProviderKind } from '@/services/api';
import { KINDS, PAYSTACK_BANKS, type ProviderFormDraft } from './types';
import { extractMessage } from './utils';

type Props = {
  open: boolean;
  onClose: () => void;
  editingId: string | null;
  draft: ProviderFormDraft;
  setDraft: React.Dispatch<React.SetStateAction<ProviderFormDraft>>;
  onSubmit: () => void;
  submitting: boolean;
  submitDisabled: boolean;
  error: unknown;
};

export function ProviderEditorDialog({
  open,
  onClose,
  editingId,
  draft,
  setDraft,
  onSubmit,
  submitting,
  submitDisabled,
  error,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingId ? 'Edit payment provider' : 'Add payment provider'}
          </DialogTitle>
          <DialogDescription>
            {editingId
              ? 'Leave Secret key blank to keep the existing cipher. Updating any field triggers an audit row.'
              : 'Credentials are encrypted at rest with AES-256-GCM. The plaintext never leaves this form.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="pp-slug">Slug</Label>
              <Input
                id="pp-slug"
                data-testid="payment-provider-slug"
                value={draft.slug}
                disabled={!!editingId}
                placeholder="paystack-main"
                onChange={(e) =>
                  setDraft((d) => ({ ...d, slug: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pp-kind">Kind</Label>
              <select
                id="pp-kind"
                className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm"
                value={draft.kind}
                disabled={!!editingId}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    kind: e.target.value as PaymentProviderKind,
                  }))
                }
              >
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pp-name">Display name</Label>
            <Input
              id="pp-name"
              data-testid="payment-provider-name"
              value={draft.displayName}
              placeholder="Paystack (Production)"
              onChange={(e) =>
                setDraft((d) => ({ ...d, displayName: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pp-baseurl">Base URL</Label>
            <Input
              id="pp-baseurl"
              data-testid="payment-provider-baseurl"
              value={draft.baseUrl}
              onChange={(e) =>
                setDraft((d) => ({ ...d, baseUrl: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pp-public">Public key (optional)</Label>
            <Input
              id="pp-public"
              value={draft.publicKey}
              placeholder="pk_live_…"
              onChange={(e) =>
                setDraft((d) => ({ ...d, publicKey: e.target.value }))
              }
            />
          </div>
          {draft.kind === 'paystack' && (
            <div className="space-y-1">
              <Label htmlFor="pp-preferred-bank">
                Preferred bank (Paystack DVA)
              </Label>
              <select
                id="pp-preferred-bank"
                data-testid="payment-provider-preferred-bank"
                className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm"
                value={draft.preferredBank}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, preferredBank: e.target.value }))
                }
              >
                {PAYSTACK_BANKS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Auto picks test-bank for sk_test_ keys, wema-bank for sk_live_.
                Override here when going live with a different bank.
              </p>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="pp-secret">
              Secret key {editingId ? '(blank = keep existing)' : ''}
            </Label>
            <Input
              id="pp-secret"
              data-testid="payment-provider-secret"
              type="password"
              value={draft.secretKey}
              placeholder={editingId ? '••••••••' : 'sk_live_…'}
              onChange={(e) =>
                setDraft((d) => ({ ...d, secretKey: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pp-webhook">
              Webhook secret (optional — falls back to secret key)
            </Label>
            <Input
              id="pp-webhook"
              type="password"
              value={draft.webhookSecret}
              placeholder={editingId ? '••••••••' : ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, webhookSecret: e.target.value }))
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) =>
                setDraft((d) => ({ ...d, enabled: e.target.checked }))
              }
            />
            Enabled (disabled providers can't be activated or tested)
          </label>
          {error ? (
            <p className="text-xs text-destructive">{extractMessage(error)}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            data-testid="payment-provider-submit"
            disabled={submitDisabled}
            onClick={onSubmit}
          >
            {submitting
              ? 'Saving…'
              : editingId
                ? 'Save changes'
                : 'Create provider'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
