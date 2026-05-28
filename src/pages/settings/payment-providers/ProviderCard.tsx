import { CheckCircle2, AlertCircle, CreditCard } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import type {
  PaymentProvider,
  PaymentProviderTestResult,
} from '@/services/api';

type Props = {
  row: PaymentProvider;
  testResult?: PaymentProviderTestResult;
  onTest: () => void;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isTesting: boolean;
  isActivating: boolean;
};

export function ProviderCard({
  row,
  testResult,
  onTest,
  onActivate,
  onEdit,
  onDelete,
  isTesting,
  isActivating,
}: Props) {
  return (
    <Card data-testid={`payment-provider-row-${row.slug}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              {row.displayName}
              {row.isActive && (
                <Badge
                  variant="default"
                  data-testid={`payment-provider-active-${row.slug}`}
                >
                  Active
                </Badge>
              )}
              {!row.enabled && <Badge variant="secondary">Disabled</Badge>}
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              {row.slug} · {row.kind} · {row.baseUrl}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Public key</span>{' '}
            <span className="font-mono">{row.publicKey ?? '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Secret</span>{' '}
            <span className="font-mono">{row.secretKeyMasked}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Webhook secret</span>{' '}
            {row.hasDedicatedWebhookSecret ? (
              <span>Dedicated</span>
            ) : (
              <span className="text-muted-foreground">
                Falls back to secret key
              </span>
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Preferred bank</span>{' '}
            <span className="font-mono">{row.preferredBank ?? 'auto'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Updated</span>{' '}
            {new Date(row.updatedAt).toLocaleString(undefined, {
              hour12: true,
            })}
          </div>
        </div>

        {testResult && (
          <div
            className={`flex items-center gap-2 rounded-md border p-2 text-xs ${
              testResult.ok
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
            data-testid={`payment-provider-test-result-${row.slug}`}
          >
            {testResult.ok ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {testResult.ok
              ? `Connection ok (${testResult.latencyMs ?? '?'} ms).`
              : testResult.error ?? 'Test failed.'}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            data-testid={`payment-provider-test-${row.slug}`}
            disabled={!row.enabled || isTesting}
            onClick={onTest}
          >
            {isTesting ? 'Testing…' : 'Test'}
          </Button>
          {!row.isActive && (
            <Button
              size="sm"
              data-testid={`payment-provider-activate-${row.slug}`}
              disabled={!row.enabled || isActivating}
              onClick={onActivate}
            >
              {isActivating ? 'Activating…' : 'Activate'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            data-testid={`payment-provider-edit-${row.slug}`}
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            data-testid={`payment-provider-delete-${row.slug}`}
            disabled={row.isActive}
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
