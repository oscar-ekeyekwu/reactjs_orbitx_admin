import { AlertCircle, CheckCircle2, ShieldCheck, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import {
  expectedDeleteSourcePhrase,
  type StorageMigration,
  type StorageMigrationVerification,
} from '@/services/api';
import { extractMessage } from './utils';

type Props = {
  migration: StorageMigration;
  latestVerification: StorageMigrationVerification | null;
  deletionsCount: number;
  providerSlug: string;
  onVerify: () => void;
  verifyPending: boolean;
  verifyError: unknown;
  onOpenDelete: () => void;
};

export function VerifyAndDeleteCard({
  migration,
  latestVerification,
  deletionsCount,
  providerSlug,
  onVerify,
  verifyPending,
  verifyError,
  onOpenDelete,
}: Props) {
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
