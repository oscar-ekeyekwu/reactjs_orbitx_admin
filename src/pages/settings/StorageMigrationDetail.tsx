import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Trash2,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import {
  expectedDeleteSourcePhrase,
  storageMigrationsApi,
  storageProvidersApi,
  type StorageMigration,
  type StorageMigrationStatus,
  type StorageMigrationVerification,
} from '@/services/api';

function progressPct(m: StorageMigration): number {
  if (m.totalDocuments === 0) return 0;
  const done = m.dryRun
    ? m.wouldMigrateCount + m.failedCount + m.skippedCount
    : m.migratedCount + m.failedCount + m.skippedCount;
  return Math.min(100, Math.round((done / m.totalDocuments) * 100));
}

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

  const providerLabel = (pid: string): string => {
    const p = providersQuery.data?.find((x) => x.id === pid);
    return p ? `${p.displayName} (${p.slug})` : pid.slice(0, 8);
  };

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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StatusBadge
                    status={migration.status}
                    dryRun={migration.dryRun}
                  />
                  <span className="text-sm text-muted-foreground">
                    {migration.id.slice(0, 8)}
                  </span>
                </CardTitle>
                <CardDescription>
                  Queued {new Date(migration.queuedAt).toLocaleString(undefined, { hour12: true })} ·
                  Anchored at{' '}
                  {new Date(
                    migration.queuedUntilCreatedAt,
                  ).toLocaleString(undefined, { hour12: true })}{' '}
                  · Batch size {migration.batchSize}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProgressBar pct={progressPct(migration)} migration={migration} />

                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <StatTile
                    label={migration.dryRun ? 'Would migrate' : 'Migrated'}
                    value={
                      migration.dryRun
                        ? migration.wouldMigrateCount
                        : migration.migratedCount
                    }
                  />
                  <StatTile
                    label="Failed"
                    value={migration.failedCount}
                    accent={
                      migration.failedCount > 0 ? 'red' : undefined
                    }
                  />
                  <StatTile
                    label="Skipped"
                    value={migration.skippedCount}
                  />
                  <StatTile
                    label="Total"
                    value={migration.totalDocuments}
                  />
                </div>

                {migration.errorMessage && (
                  <div
                    data-testid="storage-migration-loop-error"
                    className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{migration.errorMessage}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  {migration.status === 'running' && (
                    <Button
                      variant="outline"
                      data-testid="storage-migration-pause"
                      onClick={() => pauseMutation.mutate()}
                      disabled={pauseMutation.isPending}
                    >
                      Pause
                    </Button>
                  )}
                  {migration.status === 'paused' && (
                    <Button
                      data-testid="storage-migration-resume"
                      onClick={() => resumeMutation.mutate()}
                      disabled={resumeMutation.isPending}
                    >
                      Resume
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Failures</CardTitle>
                <CardDescription>
                  Per-document errors after exhausting the 3-attempt retry
                  budget (1s / 4s / 16s backoff).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {failuresQuery.isLoading ? (
                  <Spinner size="sm" />
                ) : (failuresQuery.data ?? []).length === 0 ? (
                  <p
                    data-testid="storage-migration-failures-empty"
                    className="text-sm text-muted-foreground"
                  >
                    No failures recorded.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead className="text-right">Attempt</TableHead>
                        <TableHead>Error</TableHead>
                        <TableHead>Recorded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(failuresQuery.data ?? []).map((f) => (
                        <TableRow
                          key={f.id}
                          data-testid={`storage-migration-failure-${f.documentId}`}
                        >
                          <TableCell className="font-mono text-xs">
                            {f.documentId.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {f.attempt}
                          </TableCell>
                          <TableCell className="text-xs">
                            {f.errorMessage}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {new Date(f.createdAt).toLocaleString(undefined, { hour12: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <VerifyAndDeleteCard
              migration={migration}
              latestVerification={verificationsQuery.data?.[0] ?? null}
              deletionsCount={(deletionsQuery.data ?? []).length}
              providerSlug={
                providersQuery.data?.find(
                  (p) => p.id === migration.fromProviderId,
                )?.slug ?? ''
              }
              onVerify={() => verifyMutation.mutate()}
              verifyPending={verifyMutation.isPending}
              verifyError={verifyMutation.error}
              onOpenDelete={() => {
                setDeleteSourceTyped('');
                setDeleteSourceOpen(true);
              }}
            />

            {(deletionsQuery.data ?? []).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Source deletions</CardTitle>
                  <CardDescription>
                    Per-document outcome of the explicit source-delete action.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Error</TableHead>
                        <TableHead>When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(deletionsQuery.data ?? []).map((d) => (
                        <TableRow
                          key={d.id}
                          data-testid={`storage-migration-deletion-${d.documentId}`}
                        >
                          <TableCell className="font-mono text-xs">
                            {d.documentId.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            <DeletionBadge status={d.status} />
                          </TableCell>
                          <TableCell className="text-xs">
                            {d.errorMessage ?? ''}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {new Date(d.deletedAt).toLocaleString(undefined, { hour12: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <Dialog open={deleteSourceOpen} onOpenChange={setDeleteSourceOpen}>
        <DialogContent data-testid="storage-delete-source-confirm">
          <DialogHeader>
            <DialogTitle>Delete source copies?</DialogTitle>
            <DialogDescription>
              This is the irreversible step. Type the phrase below exactly
              to enable the Delete button. Bytes still on the source
              provider will be removed; documents missing from the
              destination at re-verify time are skipped automatically.
            </DialogDescription>
          </DialogHeader>
          {migration && (
            <DeleteSourceForm
              migration={migration}
              providerSlug={
                providersQuery.data?.find(
                  (p) => p.id === migration.fromProviderId,
                )?.slug ?? ''
              }
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

interface VerifyAndDeleteCardProps {
  migration: StorageMigration;
  latestVerification: StorageMigrationVerification | null;
  deletionsCount: number;
  providerSlug: string;
  onVerify: () => void;
  verifyPending: boolean;
  verifyError: unknown;
  onOpenDelete: () => void;
}

function VerifyAndDeleteCard({
  migration,
  latestVerification,
  deletionsCount,
  providerSlug,
  onVerify,
  verifyPending,
  verifyError,
  onOpenDelete,
}: VerifyAndDeleteCardProps) {
  const migrationFinished =
    migration.status === 'completed' ||
    migration.status === 'completed_with_errors';
  const verifyDisabled =
    !migrationFinished ||
    verifyPending ||
    latestVerification?.status === 'running';
  const verifyClean = latestVerification?.status === 'completed';
  const verifyHasGaps =
    latestVerification?.status === 'completed_with_gaps';
  const sourceAlreadyDeleted = !!migration.sourceDeletedAt;
  const deleteDisabled =
    !verifyClean || sourceAlreadyDeleted || migration.migratedCount === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Verify destination + delete source
        </CardTitle>
        <CardDescription>
          Verify checks every migrated doc exists at the destination and that
          the signed-URL pipeline works. Delete source removes the bytes from
          the original provider — gated on a clean verify and a typed
          confirmation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            data-testid="storage-migration-verify"
            onClick={onVerify}
            disabled={verifyDisabled}
          >
            {verifyPending || latestVerification?.status === 'running'
              ? 'Verifying…'
              : 'Run verify'}
          </Button>
          {latestVerification && (
            <span
              data-testid="storage-migration-verify-result"
              className="text-xs"
            >
              {latestVerification.status === 'running' ? (
                <Badge variant="secondary">Running</Badge>
              ) : latestVerification.status === 'completed' ? (
                <span className="inline-flex items-center gap-1 text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified {latestVerification.verifiedCount} /{' '}
                  {latestVerification.totalChecked}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-700">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Gaps: {latestVerification.missingAtDestination} missing of{' '}
                  {latestVerification.totalChecked}
                </span>
              )}
            </span>
          )}
        </div>
        {verifyError ? (
          <p
            data-testid="storage-migration-verify-error"
            className="text-xs text-red-600"
          >
            {extractMessage(verifyError)}
          </p>
        ) : null}

        <div className="border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="destructive"
              data-testid="storage-migration-delete-source"
              onClick={onOpenDelete}
              disabled={deleteDisabled}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {sourceAlreadyDeleted
                ? 'Source already deleted'
                : 'Delete source copies'}
            </Button>
            {sourceAlreadyDeleted ? (
              <span
                data-testid="storage-migration-source-deleted"
                className="text-xs text-muted-foreground"
              >
                Deleted at{' '}
                {new Date(
                  migration.sourceDeletedAt as string,
                ).toLocaleString(undefined, { hour12: true })}{' '}
                · {deletionsCount} per-document rows
              </span>
            ) : verifyHasGaps ? (
              <span
                data-testid="storage-migration-delete-blocked"
                className="text-xs text-red-700"
              >
                Blocked — verify reported gaps. Re-run verify to retry.
              </span>
            ) : !verifyClean ? (
              <span className="text-xs text-muted-foreground">
                Run a clean verify first to enable this action.
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Confirmation phrase required:{' '}
                <code className="font-mono">
                  {expectedDeleteSourcePhrase(
                    migration.migratedCount,
                    providerSlug,
                  )}
                </code>
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DeleteSourceFormProps {
  migration: StorageMigration;
  providerSlug: string;
  typed: string;
  setTyped: (v: string) => void;
  onCancel: () => void;
  onSubmit: (confirm: string) => void;
  pending: boolean;
  error: unknown;
}

function DeleteSourceForm({
  migration,
  providerSlug,
  typed,
  setTyped,
  onCancel,
  onSubmit,
  pending,
  error,
}: DeleteSourceFormProps) {
  const expected = expectedDeleteSourcePhrase(
    migration.migratedCount,
    providerSlug,
  );
  const isMatch = typed === expected;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!isMatch) return;
        onSubmit(typed);
      }}
      className="space-y-3"
    >
      <div className="rounded-md bg-muted/40 p-3">
        <p className="text-xs text-muted-foreground">
          Type this phrase exactly to enable Delete:
        </p>
        <p className="mt-1 font-mono text-sm" data-testid="storage-delete-expected">
          {expected}
        </p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="delete-source-confirm">Your confirmation</Label>
        <Input
          id="delete-source-confirm"
          data-testid="storage-delete-source-input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      {error ? (
        <p
          data-testid="storage-delete-source-error"
          className="text-xs text-red-600"
        >
          {extractMessage(error)}
        </p>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="destructive"
          data-testid="storage-delete-source-submit"
          disabled={!isMatch || pending}
        >
          {pending ? 'Deleting…' : 'Delete source copies'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeletionBadge({
  status,
}: {
  status: 'deleted' | 'skipped_missing_at_destination' | 'failed';
}) {
  switch (status) {
    case 'deleted':
      return <Badge variant="default">Deleted</Badge>;
    case 'skipped_missing_at_destination':
      return <Badge variant="secondary">Skipped (missing at dest)</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
  }
}

function extractMessage(err: unknown): string {
  if (!err) return '';
  const apiMsg = (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  if (apiMsg) return apiMsg;
  if (err instanceof Error) return err.message;
  return 'Action failed.';
}

function StatusBadge({
  status,
  dryRun,
}: {
  status: StorageMigrationStatus;
  dryRun: boolean;
}) {
  const palette: Record<
    StorageMigrationStatus,
    { label: string; variant: 'default' | 'secondary' | 'destructive' }
  > = {
    queued: { label: 'Queued', variant: 'secondary' },
    running: { label: 'Running', variant: 'default' },
    paused: { label: 'Paused', variant: 'secondary' },
    completed: { label: 'Completed', variant: 'default' },
    completed_with_errors: {
      label: 'Completed (errors)',
      variant: 'destructive',
    },
  };
  const p = palette[status];
  return (
    <span className="inline-flex items-center gap-1">
      <Badge variant={p.variant}>{p.label}</Badge>
      {dryRun && <Badge variant="secondary">dry run</Badge>}
    </span>
  );
}

function ProgressBar({
  pct,
  migration,
}: {
  pct: number;
  migration: StorageMigration;
}) {
  return (
    <div
      data-testid="storage-migration-progress"
      data-pct={pct}
      aria-label={`Migration ${pct}% complete`}
    >
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          style={{ width: `${pct}%` }}
          className="h-full bg-primary transition-all"
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground tabular-nums">
        {pct}% ·{' '}
        {migration.dryRun
          ? `${migration.wouldMigrateCount} of ${migration.totalDocuments} verified`
          : `${migration.migratedCount} of ${migration.totalDocuments} copied`}
      </p>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'red';
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-lg font-semibold tabular-nums ${
          accent === 'red' ? 'text-red-600' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}
