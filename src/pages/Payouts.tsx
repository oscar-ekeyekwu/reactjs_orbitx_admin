import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Wallet } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Skeleton,
} from '@/components/ui';
import { payoutsApi, type PendingPayout } from '@/services/api';

/**
 * G4 — admin disbursement queue. Lists payouts in `pending_manual`
 * (recipients with no Paystack subaccount on file) and lets the
 * reviewer paste a bank receipt reference + mark each one paid.
 */
export function PayoutsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-payouts-manual'],
    queryFn: () => payoutsApi.listManual(),
  });

  const mutation = useMutation({
    mutationFn: ({ id, reference }: { id: string; reference: string }) =>
      payoutsApi.markPaid(id, reference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts-manual'] });
    },
  });

  const items = data?.items ?? [];

  return (
    <div>
      <Header
        title="Disbursements"
        subtitle="Mark manual payouts paid with the bank receipt reference"
      />

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Pending disbursements
            </CardTitle>
            <CardDescription>
              Recipients without a Paystack subaccount on file. After
              transferring from the platform bank account, paste the bank
              receipt reference + click <strong>Mark paid</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div
                className="space-y-2"
                data-testid="payouts-loading"
                role="status"
                aria-label="Loading pending disbursements"
              >
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600" data-testid="payouts-error">
                Failed to load pending disbursements.
              </p>
            )}

            {!isLoading && !error && items.length === 0 && (
              <div data-testid="payouts-empty">
                <EmptyState
                  icon={CheckCircle2}
                  title="All caught up"
                  description="No pending manual disbursements. Recipients without a Paystack subaccount land here when their orders deliver."
                />
              </div>
            )}

            {items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4">Recipient</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Period</th>
                      <th className="py-2 pr-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p) => (
                      <PayoutRow
                        key={p.id}
                        payout={p}
                        busy={
                          mutation.isPending && mutation.variables?.id === p.id
                        }
                        errored={
                          mutation.isError && mutation.variables?.id === p.id
                        }
                        onSubmit={(reference) =>
                          mutation.mutate({ id: p.id, reference })
                        }
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

function PayoutRow({
  payout,
  busy,
  errored,
  onSubmit,
}: {
  payout: PendingPayout;
  busy: boolean;
  errored: boolean;
  onSubmit: (reference: string) => void;
}) {
  const [reference, setReference] = useState('');
  const recipientName =
    payout.recipient?.name?.trim() ||
    [payout.recipient?.first_name, payout.recipient?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    payout.recipient?.email ||
    payout.recipientUserId;
  const amount = Number(payout.amount);
  return (
    <tr
      className="border-b"
      data-testid={`payout-row-${payout.id}`}
    >
      <td className="py-3 pr-4">{recipientName}</td>
      <td className="py-3 pr-4 font-semibold">
        ₦{amount.toLocaleString('en-NG')}
      </td>
      <td className="py-3 pr-4 text-muted-foreground text-xs">
        {new Date(payout.periodStart).toLocaleDateString('en-NG', {
          timeZone: 'Africa/Lagos',
        })}{' '}
        →{' '}
        {new Date(payout.periodEnd).toLocaleDateString('en-NG', {
          timeZone: 'Africa/Lagos',
        })}
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center justify-end gap-2">
          <Input
            data-testid={`payout-row-${payout.id}-reference`}
            placeholder="Bank receipt ref"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-44"
          />
          {errored && (
            <span
              className="text-xs text-red-600"
              data-testid={`payout-row-${payout.id}-error`}
            >
              Failed
            </span>
          )}
          <Button
            size="sm"
            disabled={busy || !reference.trim()}
            onClick={() => onSubmit(reference.trim())}
            data-testid={`payout-row-${payout.id}-mark-paid`}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {busy ? 'Saving…' : 'Mark paid'}
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default PayoutsPage;
