import { AlertCircle } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import type { StorageMigration } from '@/services/api';
import { ProgressBar, StatTile } from './parts';
import { StatusBadge } from '../StatusBadge';
import { progressPct } from './utils';

type Props = {
  migration: StorageMigration;
  onPause: () => void;
  onResume: () => void;
  pausePending: boolean;
  resumePending: boolean;
};

export function OverviewCard({
  migration,
  onPause,
  onResume,
  pausePending,
  resumePending,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StatusBadge status={migration.status} dryRun={migration.dryRun} />
          <span className="text-sm text-muted-foreground">
            {migration.id.slice(0, 8)}
          </span>
        </CardTitle>
        <CardDescription>
          Queued{' '}
          {new Date(migration.queuedAt).toLocaleString(undefined, {
            hour12: true,
          })}{' '}
          · Anchored at{' '}
          {new Date(migration.queuedUntilCreatedAt).toLocaleString(undefined, {
            hour12: true,
          })}{' '}
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
            accent={migration.failedCount > 0 ? 'red' : undefined}
          />
          <StatTile label="Skipped" value={migration.skippedCount} />
          <StatTile label="Total" value={migration.totalDocuments} />
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
              onClick={onPause}
              disabled={pausePending}
            >
              Pause
            </Button>
          )}
          {migration.status === 'paused' && (
            <Button
              data-testid="storage-migration-resume"
              onClick={onResume}
              disabled={resumePending}
            >
              Resume
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
