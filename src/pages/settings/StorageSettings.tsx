import { useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  HardDrive,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  History,
} from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Badge,
  Breadcrumb,
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
  storageMigrationsApi,
  storageProvidersApi,
  type CreateStorageProviderDto,
  type QueueStorageMigrationDto,
  type StorageProvider,
  type StorageProviderTestResult,
  type UpdateStorageProviderDto,
} from '@/services/api';
import { useNavigate } from 'react-router-dom';

type ProviderFormDraft = {
  slug: string;
  displayName: string;
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

const EMPTY_DRAFT: ProviderFormDraft = {
  slug: '',
  displayName: '',
  endpoint: '',
  region: '',
  bucket: '',
  accessKeyId: '',
  secretAccessKey: '',
};

export function StorageSettingsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const providersQuery = useQuery({
    queryKey: ['storage-providers'],
    queryFn: storageProvidersApi.list,
  });

  const [migrateOpen, setMigrateOpen] = useState(false);
  const [migrateDraft, setMigrateDraft] = useState<{
    fromProviderId: string;
    toProviderId: string;
    dryRun: boolean;
    batchSize: number;
    since: string;
  }>({
    fromProviderId: '',
    toProviderId: '',
    dryRun: true,
    batchSize: 25,
    since: '',
  });

  const startMigrationMutation = useMutation({
    mutationFn: (dto: QueueStorageMigrationDto) =>
      storageMigrationsApi.start(dto),
    onSuccess: (migration) => {
      setMigrateOpen(false);
      navigate(`/settings/storage/migrations/${migration.id}`);
    },
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProviderFormDraft>(EMPTY_DRAFT);

  const [confirmActivateId, setConfirmActivateId] = useState<string | null>(
    null,
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Per-row inline status: { providerId → { kind: 'idle' | 'testing' | 'tested' | 'failed' | 'activated' | 'deleting' | 'error', payload? } }
  const [rowStatus, setRowStatus] = useState<
    Record<
      string,
      | { kind: 'idle' }
      | { kind: 'testing' }
      | { kind: 'tested'; result: StorageProviderTestResult }
      | { kind: 'activating' }
      | { kind: 'activated' }
      | { kind: 'deleting' }
      | { kind: 'error'; message: string }
    >
  >({});
  const [testedIds, setTestedIds] = useState<Set<string>>(new Set());

  const setRow = (id: string, status: (typeof rowStatus)[string]) =>
    setRowStatus((prev) => ({ ...prev, [id]: status }));

  const createMutation = useMutation({
    mutationFn: (dto: CreateStorageProviderDto) =>
      storageProvidersApi.create(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['storage-providers'] });
      setEditorOpen(false);
      setDraft(EMPTY_DRAFT);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateStorageProviderDto;
    }) => storageProvidersApi.update(id, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['storage-providers'] });
      setEditorOpen(false);
      setEditingId(null);
      setDraft(EMPTY_DRAFT);
    },
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => storageProvidersApi.test(id),
    onMutate: (id) => setRow(id, { kind: 'testing' }),
    onSuccess: (result, id) => {
      setRow(id, { kind: 'tested', result });
      if (result.ok) {
        setTestedIds((prev) => new Set(prev).add(id));
      }
    },
    onError: (err, id) =>
      setRow(id, {
        kind: 'error',
        message: err instanceof Error ? err.message : 'Test failed',
      }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => storageProvidersApi.activate(id),
    onMutate: (id) => setRow(id, { kind: 'activating' }),
    onSuccess: (_data, id) => {
      setRow(id, { kind: 'activated' });
      setConfirmActivateId(null);
      void queryClient.invalidateQueries({ queryKey: ['storage-providers'] });
    },
    onError: (err, id) =>
      setRow(id, {
        kind: 'error',
        message: err instanceof Error ? err.message : 'Activation failed',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storageProvidersApi.remove(id),
    onMutate: (id) => setRow(id, { kind: 'deleting' }),
    onSuccess: () => {
      setConfirmDeleteId(null);
      void queryClient.invalidateQueries({ queryKey: ['storage-providers'] });
    },
    onError: (err, id) =>
      setRow(id, {
        kind: 'error',
        message:
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ??
          (err instanceof Error ? err.message : 'Delete failed'),
      }),
  });

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setEditorOpen(true);
  };

  const openEdit = (p: StorageProvider) => {
    setEditingId(p.id);
    setDraft({
      slug: p.slug,
      displayName: p.displayName,
      endpoint: p.endpoint,
      region: p.region,
      bucket: p.bucket,
      accessKeyId: p.accessKeyId,
      secretAccessKey: '',
    });
    setEditorOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const dto: UpdateStorageProviderDto = {
        displayName: draft.displayName,
        endpoint: draft.endpoint,
        region: draft.region,
        bucket: draft.bucket,
        accessKeyId: draft.accessKeyId,
      };
      if (draft.secretAccessKey.trim().length > 0) {
        dto.secretAccessKey = draft.secretAccessKey;
      }
      updateMutation.mutate({ id: editingId, dto });
    } else {
      createMutation.mutate({
        slug: draft.slug,
        displayName: draft.displayName,
        endpoint: draft.endpoint,
        region: draft.region,
        bucket: draft.bucket,
        accessKeyId: draft.accessKeyId,
        secretAccessKey: draft.secretAccessKey,
      });
    }
  };

  const providers = providersQuery.data ?? [];

  return (
    <div>
      <Header
        title="Storage Providers"
        subtitle="Pluggable buckets for KYC documents + receipts. Swap or onboard a new provider without a code release."
      />

      <div className="p-4 space-y-4 md:p-6">
        <Breadcrumb
          items={[
            { label: 'Settings', href: '/settings' },
            { label: 'Storage Providers' },
          ]}
        />

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Active provider receives every new upload. Existing documents
            continue to resolve via their own recorded provider — switching the
            active one is safe.
          </p>
          <div className="flex gap-2">
            <Button
              data-testid="storage-migrations-link"
              variant="outline"
              onClick={() => navigate('/settings/storage/migrations')}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              Migrations
            </Button>
            <Button
              data-testid="storage-migrate-cta"
              variant="outline"
              onClick={() => {
                const enabled = providers.filter((p) => p.enabled);
                setMigrateDraft({
                  fromProviderId: enabled[0]?.id ?? '',
                  toProviderId: enabled[1]?.id ?? '',
                  dryRun: true,
                  batchSize: 25,
                  since: '',
                });
                setMigrateOpen(true);
              }}
              disabled={providers.filter((p) => p.enabled).length < 2}
              className="gap-2"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Migrate
            </Button>
            <Button
              data-testid="storage-add-provider"
              onClick={openCreate}
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Add provider
            </Button>
          </div>
        </div>

        {providersQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : providersQuery.isError ? (
          <Card>
            <CardContent className="py-6 text-sm text-red-600">
              Couldn&apos;t load storage providers.
            </CardContent>
          </Card>
        ) : providers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              No storage providers configured. Add one to start receiving
              uploads.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {providers.map((p) => {
              const status = rowStatus[p.id] ?? { kind: 'idle' };
              const hasBeenTested = testedIds.has(p.id);
              return (
                <Card
                  key={p.id}
                  data-testid={`storage-provider-row-${p.slug}`}
                  className={p.isActive ? 'border-primary' : undefined}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4" />
                          {p.displayName}
                          {p.isActive && (
                            <Badge
                              data-testid={`storage-active-badge-${p.slug}`}
                              variant="default"
                            >
                              Active
                            </Badge>
                          )}
                          {!p.enabled && (
                            <Badge variant="secondary">Disabled</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs">
                          {p.slug} · {p.endpoint} · bucket={p.bucket} ·{' '}
                          region={p.region}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testMutation.mutate(p.id)}
                          disabled={status.kind === 'testing'}
                          data-testid={`storage-test-${p.slug}`}
                        >
                          {status.kind === 'testing' ? 'Testing…' : 'Test'}
                        </Button>
                        {!p.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!hasBeenTested) {
                                setConfirmActivateId(p.id);
                              } else {
                                activateMutation.mutate(p.id);
                              }
                            }}
                            disabled={
                              !p.enabled || status.kind === 'activating'
                            }
                            data-testid={`storage-activate-${p.slug}`}
                          >
                            {status.kind === 'activating'
                              ? 'Activating…'
                              : 'Activate'}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(p)}
                          data-testid={`storage-edit-${p.slug}`}
                        >
                          Edit
                        </Button>
                        {!p.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDeleteId(p.id)}
                            disabled={status.kind === 'deleting'}
                            data-testid={`storage-delete-${p.slug}`}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">
                        Access key:
                      </span>
                      <span className="font-mono">{p.accessKeyId}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">
                        Secret access key:
                      </span>
                      <span
                        className="font-mono"
                        data-testid={`storage-masked-secret-${p.slug}`}
                      >
                        {p.secretAccessKey.masked}
                      </span>
                      <span className="text-muted-foreground">
                        (updated {formatDate(p.secretAccessKey.updatedAt)})
                      </span>
                    </div>
                    {status.kind === 'tested' && (
                      <div
                        data-testid={`storage-test-result-${p.slug}`}
                        className={`flex items-center gap-1 pt-1 ${
                          status.result.ok ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {status.result.ok ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Test passed
                            {typeof status.result.latencyMs === 'number'
                              ? ` (${status.result.latencyMs} ms)`
                              : ''}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3.5 w-3.5" />
                            Test failed: {status.result.error ?? 'unknown'}
                          </>
                        )}
                      </div>
                    )}
                    {status.kind === 'error' && (
                      <div
                        data-testid={`storage-error-${p.slug}`}
                        className="flex items-center gap-1 pt-1 text-red-600"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        {status.message}
                      </div>
                    )}
                    {status.kind === 'activated' && (
                      <div
                        data-testid={`storage-activated-msg-${p.slug}`}
                        className="flex items-center gap-1 pt-1 text-green-600"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Active provider switched. New uploads will land in{' '}
                        {p.displayName}.
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
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
            onSubmit={handleSubmit}
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

            {(createMutation.isError || updateMutation.isError) && (
              <p
                data-testid="storage-form-error"
                className="text-xs text-red-600"
              >
                {extractErrorMessage(
                  createMutation.error ?? updateMutation.error,
                )}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditorOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-testid="storage-form-submit"
                disabled={
                  createMutation.isPending || updateMutation.isPending
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving…'
                  : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmActivateId}
        onOpenChange={(open) => !open && setConfirmActivateId(null)}
      >
        <DialogContent data-testid="storage-activate-confirm">
          <DialogHeader>
            <DialogTitle>Activate without testing?</DialogTitle>
            <DialogDescription>
              This provider hasn&apos;t been tested in this session. Bad
              credentials will break new uploads immediately. Run a test first
              or activate anyway.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmActivateId(null)}
            >
              Cancel
            </Button>
            <Button
              data-testid="storage-activate-confirm-submit"
              onClick={() => {
                if (confirmActivateId) {
                  activateMutation.mutate(confirmActivateId);
                }
              }}
            >
              Activate anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <DialogContent data-testid="storage-delete-confirm">
          <DialogHeader>
            <DialogTitle>Delete this provider?</DialogTitle>
            <DialogDescription>
              This action is permanent. The backend will refuse the delete if
              any document still references this provider, or if it is the
              active one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              data-testid="storage-delete-confirm-submit"
              variant="destructive"
              onClick={() => {
                if (confirmDeleteId) {
                  deleteMutation.mutate(confirmDeleteId);
                }
              }}
            >
              Delete provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={migrateOpen} onOpenChange={setMigrateOpen}>
        <DialogContent data-testid="storage-migrate-modal">
          <DialogHeader>
            <DialogTitle>Migrate documents</DialogTitle>
            <DialogDescription>
              Streams every KYC document from the source provider to the
              destination, anchored at queue time so uploads landing after
              this point are NOT picked up.
            </DialogDescription>
          </DialogHeader>

          <form
            data-testid="storage-migrate-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!migrateDraft.fromProviderId || !migrateDraft.toProviderId)
                return;
              const dto: QueueStorageMigrationDto = {
                fromProviderId: migrateDraft.fromProviderId,
                toProviderId: migrateDraft.toProviderId,
                dryRun: migrateDraft.dryRun,
                batchSize: migrateDraft.batchSize,
              };
              if (migrateDraft.since.trim()) {
                dto.since = new Date(migrateDraft.since).toISOString();
              }
              startMigrationMutation.mutate(dto);
            }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <Label htmlFor="migrate-from">Source provider</Label>
              <select
                id="migrate-from"
                data-testid="storage-migrate-from"
                value={migrateDraft.fromProviderId}
                onChange={(e) =>
                  setMigrateDraft((d) => ({
                    ...d,
                    fromProviderId: e.target.value,
                  }))
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
                value={migrateDraft.toProviderId}
                onChange={(e) =>
                  setMigrateDraft((d) => ({
                    ...d,
                    toProviderId: e.target.value,
                  }))
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                required
              >
                <option value="" disabled>
                  Select destination…
                </option>
                {providers
                  .filter((p) => p.id !== migrateDraft.fromProviderId)
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
                  value={migrateDraft.batchSize}
                  onChange={(e) =>
                    setMigrateDraft((d) => ({
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
                  value={migrateDraft.since}
                  onChange={(e) =>
                    setMigrateDraft((d) => ({
                      ...d,
                      since: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3">
              <input
                id="migrate-dry-run"
                data-testid="storage-migrate-dry-run"
                type="checkbox"
                checked={migrateDraft.dryRun}
                onChange={(e) =>
                  setMigrateDraft((d) => ({
                    ...d,
                    dryRun: e.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4"
              />
              <div className="space-y-0.5">
                <Label htmlFor="migrate-dry-run" className="cursor-pointer">
                  Dry run
                </Label>
                <p className="text-xs text-muted-foreground">
                  When on, the worker only verifies the source object exists
                  and is readable. No writes to the destination. Recommended
                  for first runs.
                </p>
              </div>
            </div>

            {startMigrationMutation.isError && (
              <p
                data-testid="storage-migrate-error"
                className="text-xs text-red-600"
              >
                {extractErrorMessage(startMigrationMutation.error)}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMigrateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-testid="storage-migrate-submit"
                disabled={
                  startMigrationMutation.isPending ||
                  !migrateDraft.fromProviderId ||
                  !migrateDraft.toProviderId ||
                  migrateDraft.fromProviderId === migrateDraft.toProviderId
                }
              >
                {startMigrationMutation.isPending ? 'Queuing…' : 'Start'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function extractErrorMessage(err: unknown): string {
  if (!err) return 'Save failed.';
  const apiMsg = (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  if (apiMsg) return apiMsg;
  if (err instanceof Error) return err.message;
  return 'Save failed.';
}
