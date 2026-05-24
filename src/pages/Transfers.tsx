import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { transfersApi, type PendingTransfer } from '@/services/api';

/**
 * G3 / H8 — admin reconcile queue for manual bank transfers.
 *
 * Lists `pending_transfer` orders oldest-first and lets the reviewer
 * mark each as received once they've matched it to a real deposit in
 * the bank statement. Reconciliation triggers a backend Transaction
 * INSERT + approval_decisions audit row + paymentStatus → completed,
 * after which the order becomes broadcast-eligible.
 */
export function TransfersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-transfers'],
    queryFn: () => transfersApi.listPending(),
  });

  const [reconciling, setReconciling] = useState<string | null>(null);
  const [errorRef, setErrorRef] = useState<string | null>(null);

  const reconcile = useMutation({
    mutationFn: (reference: string) => transfersApi.reconcile(reference),
    onMutate: (reference) => {
      setReconciling(reference);
      setErrorRef(null);
    },
    onSettled: () => {
      setReconciling(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transfers'] });
    },
    onError: (_err, reference) => {
      setErrorRef(reference);
    },
  });

  const items = data?.items ?? [];

  return (
    <div>
      <Header
        title="Bank transfers"
        subtitle="Reconcile manual deposits against pending orders"
      />

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Pending transfers
            </CardTitle>
            <CardDescription>
              Match each entry against the deposit reference in your bank
              statement, then click <strong>Mark received</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div
                className="space-y-2"
                data-testid="transfers-loading"
                role="status"
                aria-label="Loading pending transfers"
              >
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600" data-testid="transfers-error">
                Failed to load pending transfers.
              </p>
            )}

            {!isLoading && !error && items.length === 0 && (
              <div data-testid="transfers-empty">
                <EmptyState
                  icon={CheckCircle2}
                  title="All caught up"
                  description="No pending bank transfers right now. Manually-reconciled orders show up here when a customer pays by bank transfer."
                />
              </div>
            )}

            {items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4">Reference</th>
                      <th className="py-2 pr-4">Customer</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Submitted</th>
                      <th className="py-2 pr-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((t) => (
                      <TransferRow
                        key={t.id}
                        transfer={t}
                        busy={reconciling === t.id}
                        errored={errorRef === t.id}
                        onReconcile={() => reconcile.mutate(t.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TransferRow({
  transfer,
  busy,
  errored,
  onReconcile,
}: {
  transfer: PendingTransfer;
  busy: boolean;
  errored: boolean;
  onReconcile: () => void;
}) {
  const customerName =
    transfer.customer?.name?.trim() ||
    [transfer.customer?.first_name, transfer.customer?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    transfer.customer?.email ||
    'Unknown';
  const amount = Number(transfer.finalPrice ?? transfer.estimatedPrice);
  return (
    <tr
      className="border-b"
      data-testid={`transfer-row-${transfer.id}`}
    >
      <td className="py-3 pr-4 font-mono text-xs">{transfer.id}</td>
      <td className="py-3 pr-4">{customerName}</td>
      <td className="py-3 pr-4 font-semibold">
        ₦{amount.toLocaleString('en-NG')}
      </td>
      <td className="py-3 pr-4 text-muted-foreground">
        {new Date(transfer.createdAt).toLocaleString('en-NG', {
          timeZone: 'Africa/Lagos',
        })}
      </td>
      <td className="py-3 pr-4 text-right">
        <div className="inline-flex items-center gap-2">
          {errored && (
            <span
              className="text-xs text-red-600"
              data-testid={`transfer-row-${transfer.id}-error`}
            >
              Could not reconcile
            </span>
          )}
          <Button
            size="sm"
            disabled={busy}
            onClick={onReconcile}
            data-testid={`transfer-row-${transfer.id}-reconcile`}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {busy ? 'Reconciling…' : 'Mark received'}
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default TransfersPage;
