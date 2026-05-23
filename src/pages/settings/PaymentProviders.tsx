import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  PlusCircle,
} from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Spinner,
} from '@/components/ui';
import {
  paymentProvidersApi,
  type CreatePaymentProviderDto,
  type PaymentProvider,
  type PaymentProviderKind,
  type PaymentProviderTestResult,
  type UpdatePaymentProviderDto,
} from '@/services/api';

const KINDS: { value: PaymentProviderKind; label: string }[] = [
  { value: 'paystack', label: 'Paystack' },
];

interface ProviderFormDraft {
  slug: string;
  kind: PaymentProviderKind;
  displayName: string;
  baseUrl: string;
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  enabled: boolean;
}

const EMPTY_DRAFT: ProviderFormDraft = {
  slug: '',
  kind: 'paystack',
  displayName: '',
  baseUrl: 'https://api.paystack.co',
  publicKey: '',
  secretKey: '',
  webhookSecret: '',
  enabled: true,
};

export function PaymentProvidersPage() {
  const queryClient = useQueryClient();
  const providersQuery = useQuery({
    queryKey: ['payment-providers'],
    queryFn: paymentProvidersApi.list,
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProviderFormDraft>(EMPTY_DRAFT);

  const [testResults, setTestResults] = useState<
    Record<string, PaymentProviderTestResult | undefined>
  >({});
  const [confirmDelete, setConfirmDelete] = useState<PaymentProvider | null>(
    null,
  );

  const createMutation = useMutation({
    mutationFn: (dto: CreatePaymentProviderDto) =>
      paymentProvidersApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
      closeEditor();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdatePaymentProviderDto;
    }) => paymentProvidersApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
      closeEditor();
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => paymentProvidersApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentProvidersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
      setConfirmDelete(null);
    },
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => paymentProvidersApi.test(id),
    onSuccess: (result, id) => {
      setTestResults((prev) => ({ ...prev, [id]: result }));
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setEditorOpen(true);
  };

  const openEdit = (row: PaymentProvider) => {
    setEditingId(row.id);
    setDraft({
      slug: row.slug,
      kind: row.kind,
      displayName: row.displayName,
      baseUrl: row.baseUrl,
      publicKey: row.publicKey ?? '',
      secretKey: '',
      webhookSecret: '',
      enabled: row.enabled,
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  const submitDraft = () => {
    if (editingId) {
      const patch: UpdatePaymentProviderDto = {
        displayName: draft.displayName,
        baseUrl: draft.baseUrl,
        // null clears the field; empty string is meaningful for webhookSecret
        // (clears the dedicated secret), so we forward it as-is.
        publicKey: draft.publicKey === '' ? null : draft.publicKey,
        enabled: draft.enabled,
      };
      if (draft.secretKey) patch.secretKey = draft.secretKey;
      if (draft.webhookSecret !== '') patch.webhookSecret = draft.webhookSecret;
      updateMutation.mutate({ id: editingId, dto: patch });
      return;
    }
    const create: CreatePaymentProviderDto = {
      slug: draft.slug.trim(),
      kind: draft.kind,
      displayName: draft.displayName.trim(),
      baseUrl: draft.baseUrl.trim(),
      secretKey: draft.secretKey,
      enabled: draft.enabled,
    };
    if (draft.publicKey) create.publicKey = draft.publicKey.trim();
    if (draft.webhookSecret) create.webhookSecret = draft.webhookSecret;
    createMutation.mutate(create);
  };

  const isCreateValid =
    !!draft.slug &&
    !!draft.displayName &&
    !!draft.baseUrl &&
    draft.secretKey.length >= 8;

  const isEditValid =
    !!draft.displayName &&
    !!draft.baseUrl &&
    // For edits secretKey is optional (omit to keep existing cipher).
    (draft.secretKey === '' || draft.secretKey.length >= 8);

  const submitDisabled =
    (editingId ? !isEditValid : !isCreateValid) ||
    createMutation.isPending ||
    updateMutation.isPending;

  return (
    <div>
      <Header
        title="Payment Providers"
        subtitle="Pluggable gateway registry. Swap or rotate credentials without a redeploy."
      />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            asChild
            className="gap-2 text-muted-foreground"
          >
            <Link to="/settings">
              <ArrowLeft className="h-4 w-4" /> Back to Settings
            </Link>
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <PlusCircle className="h-4 w-4" /> Add provider
          </Button>
        </div>

        {providersQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : !providersQuery.data || providersQuery.data.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No payment providers configured yet. Click <b>Add provider</b>{' '}
              above to create the first one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {providersQuery.data.map((row) => (
              <ProviderCard
                key={row.id}
                row={row}
                testResult={testResults[row.id]}
                onTest={() => testMutation.mutate(row.id)}
                onActivate={() => activateMutation.mutate(row.id)}
                onEdit={() => openEdit(row)}
                onDelete={() => setConfirmDelete(row)}
                isTesting={
                  testMutation.isPending && testMutation.variables === row.id
                }
                isActivating={
                  activateMutation.isPending &&
                  activateMutation.variables === row.id
                }
              />
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => (open ? null : closeEditor())}
      >
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
            <div className="grid grid-cols-2 gap-3">
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
            {(createMutation.error || updateMutation.error) && (
              <p className="text-xs text-destructive">
                {extractMessage(
                  createMutation.error ?? updateMutation.error,
                )}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditor}>
              Cancel
            </Button>
            <Button
              data-testid="payment-provider-submit"
              disabled={submitDisabled}
              onClick={submitDraft}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving…'
                : editingId
                  ? 'Save changes'
                  : 'Create provider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => (open ? null : setConfirmDelete(null))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete payment provider?</DialogTitle>
            <DialogDescription>
              {confirmDelete?.isActive
                ? 'This provider is currently active. Activate a different provider before deleting this one.'
                : `${confirmDelete?.displayName ?? ''} will be removed and the action recorded in the audit log.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={
                !confirmDelete ||
                confirmDelete.isActive ||
                deleteMutation.isPending
              }
              onClick={() =>
                confirmDelete && deleteMutation.mutate(confirmDelete.id)
              }
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProviderCard({
  row,
  testResult,
  onTest,
  onActivate,
  onEdit,
  onDelete,
  isTesting,
  isActivating,
}: {
  row: PaymentProvider;
  testResult?: PaymentProviderTestResult;
  onTest: () => void;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isTesting: boolean;
  isActivating: boolean;
}) {
  return (
    <Card data-testid={`payment-provider-row-${row.slug}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              {row.displayName}
              {row.isActive && (
                <Badge
                  variant="default"
                  data-testid={`payment-provider-active-${row.slug}`}
                >
                  Active
                </Badge>
              )}
              {!row.enabled && (
                <Badge variant="secondary">Disabled</Badge>
              )}
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              {row.slug} · {row.kind} · {row.baseUrl}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div>
            <span className="text-muted-foreground">Public key</span>{' '}
            <span className="font-mono">{row.publicKey ?? '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Secret</span>{' '}
            <span className="font-mono">{row.secretKeyMasked}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Webhook secret</span>{' '}
            {row.hasDedicatedWebhookSecret ? (
              <span>Dedicated</span>
            ) : (
              <span className="text-muted-foreground">
                Falls back to secret key
              </span>
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Updated</span>{' '}
            {new Date(row.updatedAt).toLocaleString()}
          </div>
        </div>

        {testResult && (
          <div
            className={`flex items-center gap-2 rounded-md border p-2 text-xs ${
              testResult.ok
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
            data-testid={`payment-provider-test-result-${row.slug}`}
          >
            {testResult.ok ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {testResult.ok
              ? `Connection ok (${testResult.latencyMs ?? '?'} ms).`
              : testResult.error ?? 'Test failed.'}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            data-testid={`payment-provider-test-${row.slug}`}
            disabled={!row.enabled || isTesting}
            onClick={onTest}
          >
            {isTesting ? 'Testing…' : 'Test'}
          </Button>
          {!row.isActive && (
            <Button
              size="sm"
              data-testid={`payment-provider-activate-${row.slug}`}
              disabled={!row.enabled || isActivating}
              onClick={onActivate}
            >
              {isActivating ? 'Activating…' : 'Activate'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            data-testid={`payment-provider-edit-${row.slug}`}
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            data-testid={`payment-provider-delete-${row.slug}`}
            disabled={row.isActive}
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function extractMessage(err: unknown): string {
  if (!err) return '';
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return 'Something went wrong.';
}
