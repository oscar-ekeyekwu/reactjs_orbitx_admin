import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HardDrive } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Badge,
  Breadcrumb,
  Card,
  CardContent,
  EmptyState,
  TableSkeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import {
  storageMigrationsApi,
  storageProvidersApi,
  type StorageMigrationStatus,
} from '@/services/api';

export function StorageMigrationsPage() {
  const migrationsQuery = useQuery({
    queryKey: ['storage-migrations'],
    queryFn: storageMigrationsApi.list,
    // Refetch every 5s — the list is the operator's progress radar.
    refetchInterval: 5000,
  });
  const providersQuery = useQuery({
    queryKey: ['storage-providers'],
    queryFn: storageProvidersApi.list,
  });

  const providerLabel = (id: string): string => {
    const p = providersQuery.data?.find((x) => x.id === id);
    return p ? `${p.displayName} (${p.slug})` : id.slice(0, 8);
  };

  return (
    <div>
      <Header
        title="Storage Migrations"
        subtitle="Cross-provider document copy jobs. Anchored at queue time — uploads during a run stay on the source until a later migration moves them."
      />

      <div className="p-4 space-y-4 md:p-6">
        <Breadcrumb
          items={[
            { label: 'Settings', href: '/settings' },
            { label: 'Storage', href: '/settings/storage' },
            { label: 'Migrations' },
          ]}
        />

        {migrationsQuery.isLoading ? (
          <Card>
            <CardContent className="p-4">
              <TableSkeleton rows={4} columns={5} />
            </CardContent>
          </Card>
        ) : (migrationsQuery.data ?? []).length === 0 ? (
          <div data-testid="storage-migrations-empty">
            <EmptyState
              icon={HardDrive}
              title="No migrations yet"
              description="Queued bucket migrations and their progress show up here. Start one from the Storage Providers settings page."
            />
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                  <TableHead className="text-right">Failures</TableHead>
                  <TableHead>Queued</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(migrationsQuery.data ?? []).map((m) => (
                  <TableRow
                    key={m.id}
                    data-testid={`storage-migration-row-${m.id}`}
                  >
                    <TableCell className="font-mono text-xs">
                      {providerLabel(m.fromProviderId)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {providerLabel(m.toProviderId)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.status} dryRun={m.dryRun} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.dryRun
                        ? `${m.wouldMigrateCount} / ${m.totalDocuments}`
                        : `${m.migratedCount} / ${m.totalDocuments}`}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.failedCount}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(m.queuedAt).toLocaleString(undefined, { hour12: true })}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/settings/storage/migrations/${m.id}`}
                        className="text-xs text-primary underline-offset-4 hover:underline"
                      >
                        Detail
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
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

