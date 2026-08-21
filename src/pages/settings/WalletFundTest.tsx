import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, CheckCircle2, Wallet } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/components/ui';
import { walletTestApi, type FundByAccountResult } from '@/services/api';

// `amount` is registered with `valueAsNumber: true` on the Input below,
// so by the time it reaches the resolver it's already a number. Using
// `z.coerce.number()` here would force the schema's INPUT type to
// `unknown` (so it can coerce anything), which trips the same
// react-hook-form Resolver<TFieldValues> mismatch we hit on
// SupportInfoSettings.
const fundSchema = z.object({
  accountNumber: z
    .string()
    .trim()
    .min(8, 'Account number must be at least 8 digits')
    .max(20, 'Account number must be at most 20 digits')
    .regex(/^\d+$/, 'Digits only'),
  amount: z
    .number({ message: 'Enter an amount' })
    .positive('Amount must be greater than zero')
    .max(10_000_000, 'Use a smaller test amount'),
});

type FundFormData = z.infer<typeof fundSchema>;

const DEFAULTS: FundFormData = {
  accountNumber: '',
  amount: 1000,
};

function extractMessage(err: unknown): string {
  if (!err) return 'Funding failed.';
  const apiMsg = (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  if (apiMsg) return apiMsg;
  if (err instanceof Error) return err.message;
  return 'Funding failed.';
}

export function WalletFundTestPage() {
  const [lastResult, setLastResult] = useState<FundByAccountResult | null>(
    null,
  );

  const form = useForm<FundFormData>({
    resolver: zodResolver(fundSchema),
    defaultValues: DEFAULTS,
  });

  const mutation = useMutation({
    mutationFn: walletTestApi.fundByAccount,
    onSuccess: (result) => {
      setLastResult(result);
      form.reset({ accountNumber: '', amount: DEFAULTS.amount });
    },
  });

  const onSubmit = (data: FundFormData) => {
    setLastResult(null);
    mutation.mutate(data);
  };

  const errors = form.formState.errors;

  return (
    <div>
      <Header
        title="Fund by Account (Test)"
        subtitle="Credit a driver wallet by virtual account number — rehearses the Paystack funding flow without a real bank transfer."
      />

      <div className="p-4 md:p-6">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: 'Settings', href: '/settings' },
            { label: 'Fund by Account (Test)' },
          ]}
        />

        <div className="max-w-2xl space-y-6">
          <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-700" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold">Non-production tool</p>
              <p className="mt-1">
                The backend refuses this request when{' '}
                <code className="rounded bg-yellow-100 px-1">
                  NODE_ENV=production
                </code>
                . Use it on dev/staging to credit a driver wallet via virtual
                account number — the credit reuses the same code path the
                Paystack webhook hits, so push notifications and socket
                updates fire identically.
              </p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Credit a wallet
                </CardTitle>
                <CardDescription>
                  Enter the virtual account number generated for the driver
                  (visible in their mobile Wallet screen) and the naira amount
                  to credit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Virtual account number</Label>
                  <Input
                    id="accountNumber"
                    type="text"
                    inputMode="numeric"
                    placeholder="1234567890"
                    autoComplete="off"
                    {...form.register('accountNumber')}
                  />
                  <p className="text-xs text-muted-foreground">
                    The driver-facing account number from the Generate Account
                    flow.
                  </p>
                  {errors.accountNumber && (
                    <p className="text-xs text-red-500">
                      {errors.accountNumber.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₦)</Label>
                  <Input
                    id="amount"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    placeholder="5000"
                    {...form.register('amount', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Whole naira. Decimals are accepted but real Paystack DVA
                    funding typically arrives whole.
                  </p>
                  {errors.amount && (
                    <p className="text-xs text-red-500">
                      {errors.amount.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 flex items-center justify-end gap-3">
              {mutation.isError && (
                <p className="text-sm text-red-500">
                  {extractMessage(mutation.error)}
                </p>
              )}
              <Button type="submit" disabled={mutation.isPending}>
                <Wallet className="mr-2 h-4 w-4" />
                {mutation.isPending ? 'Crediting…' : 'Credit wallet'}
              </Button>
            </div>
          </form>

          {lastResult && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  Wallet credited
                </CardTitle>
                <CardDescription className="text-green-700">
                  The driver's wallet balance has been updated and a push
                  notification + socket event have been emitted.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">User ID</dt>
                  <dd className="font-mono">{lastResult.userId}</dd>
                  <dt className="text-muted-foreground">Transaction ID</dt>
                  <dd className="font-mono">{lastResult.transactionId}</dd>
                  <dt className="text-muted-foreground">Reference</dt>
                  <dd className="font-mono">{lastResult.reference}</dd>
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd>
                    ₦
                    {lastResult.amountNaira.toLocaleString('en-NG', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </dd>
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
