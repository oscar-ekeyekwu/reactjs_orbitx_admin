import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, X } from 'lucide-react';
import { Button, ConfirmDialog } from '@/components/ui';
import { usersApi, type BulkPurgeUsersResult } from '@/services/api';
import { errorMessage } from './error-message';

interface BulkDeleteUsersBarProps {
  selectedIds: string[];
  /** "customer" | "driver" — pluralised in copy. */
  noun: string;
  /** TanStack key of the list to invalidate (e.g. ["customers"]). */
  listQueryKey: string[];
  /** Called with the ids that were actually deleted so the page can prune its selection. */
  onDeleted: (deletedIds: string[]) => void;
}

/**
 * Selection toolbar + confirm + outcome summary for the Customers /
 * Drivers list pages. The backend purges each id in its own
 * transaction, so a single blocked account (e.g. a company owner with
 * other members) is reported by id while the rest still go through.
 */
export function BulkDeleteUsersBar({
  selectedIds,
  noun,
  listQueryKey,
  onDeleted,
}: BulkDeleteUsersBarProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [result, setResult] = React.useState<BulkPurgeUsersResult | null>(
    null,
  );

  const mutation = useMutation({
    mutationFn: (ids: string[]) => usersApi.bulkDelete(ids),
    onSuccess: (data) => {
      setResult(data);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: listQueryKey });
      onDeleted(data.deleted);
    },
  });

  const count = selectedIds.length;
  const plural = count === 1 ? noun : `${noun}s`;

  return (
    <>
      {count > 0 && (
        <div
          className="flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          data-testid="bulk-delete-bar"
        >
          <p className="text-sm font-medium">
            {count} {plural} selected
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeleted(selectedIds)}
              disabled={mutation.isPending}
            >
              <X className="mr-1 h-4 w-4" />
              Clear selection
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                mutation.reset();
                setOpen(true);
              }}
              disabled={mutation.isPending}
              data-testid="bulk-delete-button"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete selected
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div
          className="space-y-1 rounded-md border px-4 py-3 text-sm"
          role="status"
          data-testid="bulk-delete-result"
        >
          <p className="font-medium">
            {result.deleted.length} {result.deleted.length === 1 ? noun : `${noun}s`}{' '}
            permanently deleted
            {result.failed.length > 0 && `, ${result.failed.length} could not be deleted`}
            .
          </p>
          {result.failed.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-5 text-destructive">
              {result.failed.map((f) => (
                <li key={f.id}>
                  <span className="font-mono">{f.id.slice(0, 8)}</span>: {f.reason}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="text-xs text-muted-foreground underline"
            onClick={() => setResult(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          if (!mutation.isPending) setOpen(next);
        }}
        destructive
        title={`Permanently delete ${count} ${plural}?`}
        description={
          <>
            Each account is removed together with <strong>every related record</strong>:
            orders, wallet and transactions, payouts, documents, support tickets
            and sign-in sessions. This cannot be undone.
            {mutation.isError && (
              <span className="mt-2 block text-destructive">
                {errorMessage(mutation.error)}
              </span>
            )}
          </>
        }
        confirmLabel={`Delete ${count} ${plural}`}
        isPending={mutation.isPending}
        onConfirm={() => mutation.mutate(selectedIds)}
      />
    </>
  );
}
