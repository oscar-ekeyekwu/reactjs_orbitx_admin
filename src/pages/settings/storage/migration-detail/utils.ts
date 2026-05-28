import type { StorageMigration } from '@/services/api';

export function progressPct(m: StorageMigration): number {
  if (m.totalDocuments === 0) return 0;
  const done = m.dryRun
    ? m.wouldMigrateCount + m.failedCount + m.skippedCount
    : m.migratedCount + m.failedCount + m.skippedCount;
  return Math.min(100, Math.round((done / m.totalDocuments) * 100));
}

export function extractMessage(err: unknown): string {
  if (!err) return '';
  const apiMsg = (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  if (apiMsg) return apiMsg;
  if (err instanceof Error) return err.message;
  return 'Action failed.';
}
