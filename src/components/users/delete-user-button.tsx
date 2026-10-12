import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Button, ConfirmDialog } from '@/components/ui';
import { usersApi } from '@/services/api';
import type { User } from '@/types';
import { errorMessage } from './error-message';

interface DeleteUserButtonProps {
  user: User;
  /** "customer" | "driver" — used in copy only. */
  noun: string;
  /** Where to go once the record is gone (e.g. "/customers"). */
  listPath: string;
  /** TanStack key of the list to invalidate (e.g. ["customers"]). */
  listQueryKey: string[];
}

/**
 * Permanent "clear this account" action for the Customer / Driver
 * detail pages. This is a hard delete on the backend — the user row
 * and every related record (orders, wallet, documents, tokens…) are
 * removed in one transaction — so the confirm copy spells that out.
 */
export function DeleteUserButton({
  user,
  noun,
  listPath,
  listQueryKey,
}: DeleteUserButtonProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const mutation = useMutation({
    mutationFn: () => usersApi.delete(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listQueryKey });
      queryClient.removeQueries({ queryKey: [noun, user.id] });
      navigate(listPath, { replace: true });
    },
  });

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          mutation.reset();
          setOpen(true);
        }}
        disabled={mutation.isPending}
        className="w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 sm:w-auto"
        data-testid="delete-user-button"
      >
        <Trash2 className="h-4 w-4" />
        Delete permanently
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          if (!mutation.isPending) setOpen(next);
        }}
        destructive
        title={`Permanently delete ${user.name}?`}
        description={
          <>
            This removes the {noun} account and <strong>every related record</strong>:
            orders, wallet and transactions, payouts, documents, support tickets
            and sign-in sessions. It cannot be undone.
            {mutation.isError && (
              <span
                className="mt-2 block text-destructive"
                data-testid="delete-user-error"
              >
                {errorMessage(mutation.error)}
              </span>
            )}
          </>
        }
        confirmLabel="Delete permanently"
        isPending={mutation.isPending}
        onConfirm={() => mutation.mutate()}
      />
    </>
  );
}
