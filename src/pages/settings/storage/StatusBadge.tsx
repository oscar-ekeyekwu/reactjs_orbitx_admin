import { Badge } from '@/components/ui';
import type { StorageMigrationStatus } from '@/services/api';

export function StatusBadge({
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
