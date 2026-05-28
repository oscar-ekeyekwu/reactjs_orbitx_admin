import { useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { PlusCircle, ArrowRightLeft, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout';
import {
  Breadcrumb,
  Button,
  Card,
  CardContent,
  Spinner,
} from '@/components/ui';
import {
  storageMigrationsApi,
  storageProvidersApi,
  type CreateStorageProviderDto,
  type QueueStorageMigrationDto,
  type StorageProvider,
  type UpdateStorageProviderDto,
} from '@/services/api';
import { ProviderRow } from './storage/ProviderRow';
import { ProviderEditorDialog } from './storage/ProviderEditorDialog';
import {
  ActivateConfirmDialog,
  DeleteConfirmDialog,
} from './storage/ConfirmDialogs';
import { MigrateDialog } from './storage/MigrateDialog';
import {
  EMPTY_MIGRATE_DRAFT,
  EMPTY_PROVIDER_DRAFT,
  type ProviderFormDraft,
  type RowStatus,
} from './storage/types';
import { extractErrorMessage } from './storage/utils';

export function StorageSettingsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const providersQuery = useQuery({
    queryKey: ['storage-providers'],
    queryFn: storageProvidersApi.list,
  });
  const providers = providersQuery.data ?? [];

  const [migrateOpen, setMigrateOpen] = useState(false);
  const [migrateDraft, setMigrateDraft] = useState(EMPTY_MIGRATE_DRAFT);

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
  const [draft, setDraft] = useState<ProviderFormDraft>(EMPTY_PROVIDER_DRAFT);

  const [confirmActivateId, setConfirmActivateId] = useState<string | null>(
    null,
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({});
  const [testedIds, setTestedIds] = useState<Set<string>>(new Set());

  const setRow = (id: string, status: RowStatus) =>
    setRowStatus((prev) => ({ ...prev, [id]: status }));

  const createMutation = useMutation({
    mutationFn: (dto: CreateStorageProviderDto) =>
      storageProvidersApi.create(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['storage-providers'] });
      setEditorOpen(false);
      setDraft(EMPTY_PROVIDER_DRAFT);
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
      setDraft(EMPTY_PROVIDER_DRAFT);
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
    setDraft(EMPTY_PROVIDER_DRAFT);
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

  const handleEditorSubmit = (e: React.FormEvent) => {
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

  const handleMigrateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!migrateDraft.fromProviderId || !migrateDraft.toProviderId) return;
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
  };

  const handleActivate = (id: string, hasBeenTested: boolean) => {
    if (!hasBeenTested) {
      setConfirmActivateId(id);
    } else {
      activateMutation.mutate(id);
    }
  };

  const openMigrateDialog = () => {
    const enabled = providers.filter((p) => p.enabled);
    setMigrateDraft({
      fromProviderId: enabled[0]?.id ?? '',
      toProviderId: enabled[1]?.id ?? '',
      dryRun: true,
      batchSize: 25,
      since: '',
    });
    setMigrateOpen(true);
  };

  const editorError =
    createMutation.isError || updateMutation.isError
      ? extractErrorMessage(createMutation.error ?? updateMutation.error)
      : null;
  const migrateError = startMigrationMutation.isError
    ? extractErrorMessage(startMigrationMutation.error)
    : null;

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
              onClick={openMigrateDialog}
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
            {providers.map((p) => (
              <ProviderRow
                key={p.id}
                provider={p}
                status={rowStatus[p.id] ?? { kind: 'idle' }}
                hasBeenTested={testedIds.has(p.id)}
                onTest={(id) => testMutation.mutate(id)}
                onActivate={handleActivate}
                onEdit={openEdit}
                onDelete={(id) => setConfirmDeleteId(id)}
              />
            ))}
          </div>
        )}
      </div>

      <ProviderEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editingId={editingId}
        draft={draft}
        setDraft={setDraft}
        onSubmit={handleEditorSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
        errorMessage={editorError}
      />

      <ActivateConfirmDialog
        open={!!confirmActivateId}
        onCancel={() => setConfirmActivateId(null)}
        onConfirm={() => {
          if (confirmActivateId) activateMutation.mutate(confirmActivateId);
        }}
      />

      <DeleteConfirmDialog
        open={!!confirmDeleteId}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) deleteMutation.mutate(confirmDeleteId);
        }}
      />

      <MigrateDialog
        open={migrateOpen}
        onOpenChange={setMigrateOpen}
        providers={providers}
        draft={migrateDraft}
        setDraft={setMigrateDraft}
        onSubmit={handleMigrateSubmit}
        submitting={startMigrationMutation.isPending}
        errorMessage={migrateError}
      />
    </div>
  );
}
