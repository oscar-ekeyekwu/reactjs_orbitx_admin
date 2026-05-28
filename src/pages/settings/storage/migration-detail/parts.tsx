import { Badge } from '@/components/ui';
import type { StorageMigration } from '@/services/api';

export function DeletionBadge({
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

export function ProgressBar({
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

export function StatTile({
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
