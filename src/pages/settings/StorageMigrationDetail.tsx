import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout';
import {
  Breadcrumb,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@/components/ui';
import {
  storageMigrationsApi,
  storageProvidersApi,
} from '@/services/api';
import { OverviewCard } from './storage/migration-detail/OverviewCard';
import { FailuresCard } from './storage/migration-detail/FailuresCard';
import { VerifyAndDeleteCard } from './storage/migration-detail/VerifyAndDeleteCard';
import { DeletionsCard } from './storage/migration-detail/DeletionsCard';
import { DeleteSourceForm } from './storage/migration-detail/DeleteSourceForm';

export function StorageMigrationDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const migrationQuery = useQuery({
    queryKey: ['storage-migration', id],
    queryFn: () => storageMigrationsApi.findOne(id),
    enabled: !!id,
    // 3s poll while the migration could still be moving.
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (
        status === 'queued' ||
        status === 'running' ||
        status === 'paused'
      ) {
        return 3000;
      }
      return false;
    },
  });
  const failuresQuery = useQuery({
    queryKey: ['storage-migration-failures', id],
    queryFn: () => storageMigrationsApi.failures(id),
    enabled: !!id,
  });
  const providersQuery = useQuery({
    queryKey: ['storage-providers'],
    queryFn: storageProvidersApi.list,
  });

  const pauseMutation = useMutation({
    mutationFn: () => storageMigrationsApi.pause(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['storage-migration', id],
      });
    },
  });
  const resumeMutation = useMutation({
    mutationFn: () => storageMigrationsApi.resume(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['storage-migration', id],
      });
    },
  });

  // STG-5 — verify pass + source-delete state.
  const verificationsQuery = useQuery({
    queryKey: ['storage-migration-verifications', id],
    queryFn: () => storageMigrationsApi.verifications(id),
    enabled: !!id,
    refetchInterval: (q) => {
      const latest = q.state.data?.[0];
      return latest?.status === 'running' ? 3000 : false;
    },
  });
  const deletionsQuery = useQuery({
    queryKey: ['storage-migration-deletions', id],
    queryFn: () => storageMigrationsApi.deletions(id),
    enabled: !!id,
  });
  const verifyMutation = useMutation({
    mutationFn: () => storageMigrationsApi.verify(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['storage-migration-verifications', id],
      });
    },
  });
  const [deleteSourceOpen, setDeleteSourceOpen] = useState(false);
  const [deleteSourceTyped, setDeleteSourceTyped] = useState('');
  const deleteSourceMutation = useMutation({
    mutationFn: (confirm: string) =>
      storageMigrationsApi.deleteSource(id, confirm),
    onSuccess: () => {
      setDeleteSourceOpen(false);
      setDeleteSourceTyped('');
      void queryClient.invalidateQueries({
        queryKey: ['storage-migration', id],
      });
      void queryClient.invalidateQueries({
        queryKey: ['storage-migration-deletions', id],
      });
    },
  });

  const migration = migrationQuery.data;
  const fromProviderSlug = migration
    ? providersQuery.data?.find((p) => p.id === migration.fromProviderId)
        ?.slug ?? ''
    : '';

  const providerLabel = (pid: string): string => {
    const p = providersQuery.data?.find((x) => x.id === pid);
    return p ? `${p.displayName} (${p.slug})` : pid.slice(0, 8);
  };

  const deletions = deletionsQuery.data ?? [];

  return (
    <div>
      <Header
        title="Migration detail"
        subtitle={
          migration
            ? `${providerLabel(migration.fromProviderId)} → ${providerLabel(migration.toProviderId)}`
            : 'Loading…'
        }
      />

      <div className="p-4 space-y-4 md:p-6">
        <Breadcrumb
          items={[
            { label: 'Settings', href: '/settings' },
            { label: 'Storage', href: '/settings/storage' },
            { label: 'Migrations', href: '/settings/storage/migrations' },
            { label: id ? id.slice(0, 8) : 'Migration' },
          ]}
        />

        {migrationQuery.isLoading || !migration ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <OverviewCard
              migration={migration}
              onPause={() => pauseMutation.mutate()}
              onResume={() => resumeMutation.mutate()}
              pausePending={pauseMutation.isPending}
              resumePending={resumeMutation.isPending}
            />

            <FailuresCard
              failures={failuresQuery.data ?? []}
              isLoading={failuresQuery.isLoading}
            />

            <VerifyAndDeleteCard
              migration={migration}
              latestVerification={verificationsQuery.data?.[0] ?? null}
              deletionsCount={deletions.length}
              providerSlug={fromProviderSlug}
              onVerify={() => verifyMutation.mutate()}
              verifyPending={verifyMutation.isPending}
              verifyError={verifyMutation.error}
              onOpenDelete={() => {
                setDeleteSourceTyped('');
                setDeleteSourceOpen(true);
              }}
            />

            {deletions.length > 0 && <DeletionsCard deletions={deletions} />}
          </>
        )}
      </div>

      <Dialog open={deleteSourceOpen} onOpenChange={setDeleteSourceOpen}>
        <DialogContent data-testid="storage-delete-source-confirm">
          <DialogHeader>
            <DialogTitle>Delete source copies?</DialogTitle>
            <DialogDescription>
              This is the irreversible step. Type the phrase below exactly to
              enable the Delete button. Bytes still on the source provider will
              be removed; documents missing from the destination at re-verify
              time are skipped automatically.
            </DialogDescription>
          </DialogHeader>
          {migration && (
            <DeleteSourceForm
              migration={migration}
              providerSlug={fromProviderSlug}
              typed={deleteSourceTyped}
              setTyped={setDeleteSourceTyped}
              onCancel={() => setDeleteSourceOpen(false)}
              onSubmit={(phrase) => deleteSourceMutation.mutate(phrase)}
              pending={deleteSourceMutation.isPending}
              error={deleteSourceMutation.error}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
