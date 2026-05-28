import { HardDrive, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import type { StorageProvider } from '@/services/api';
import type { RowStatus } from './types';
import { formatDate } from './utils';

type Props = {
  provider: StorageProvider;
  status: RowStatus;
  hasBeenTested: boolean;
  onTest: (id: string) => void;
  onActivate: (id: string, hasBeenTested: boolean) => void;
  onEdit: (provider: StorageProvider) => void;
  onDelete: (id: string) => void;
};

export function ProviderRow({
  provider: p,
  status,
  hasBeenTested,
  onTest,
  onActivate,
  onEdit,
  onDelete,
}: Props) {
  return (
    <Card
      data-testid={`storage-provider-row-${p.slug}`}
      className={p.isActive ? 'border-primary' : undefined}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              {p.displayName}
              {p.isActive && (
                <Badge
                  data-testid={`storage-active-badge-${p.slug}`}
                  variant="default"
                >
                  Active
                </Badge>
              )}
              {!p.enabled && <Badge variant="secondary">Disabled</Badge>}
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              {p.slug} · {p.endpoint} · bucket={p.bucket} · region={p.region}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTest(p.id)}
              disabled={status.kind === 'testing'}
              data-testid={`storage-test-${p.slug}`}
            >
              {status.kind === 'testing' ? 'Testing…' : 'Test'}
            </Button>
            {!p.isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onActivate(p.id, hasBeenTested)}
                disabled={!p.enabled || status.kind === 'activating'}
                data-testid={`storage-activate-${p.slug}`}
              >
                {status.kind === 'activating' ? 'Activating…' : 'Activate'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(p)}
              data-testid={`storage-edit-${p.slug}`}
            >
              Edit
            </Button>
            {!p.isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(p.id)}
                disabled={status.kind === 'deleting'}
                data-testid={`storage-delete-${p.slug}`}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-xs">
        <div className="flex gap-2">
          <span className="text-muted-foreground">Access key:</span>
          <span className="font-mono">{p.accessKeyId}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-muted-foreground">Secret access key:</span>
          <span
            className="font-mono"
            data-testid={`storage-masked-secret-${p.slug}`}
          >
            {p.secretAccessKey.masked}
          </span>
          <span className="text-muted-foreground">
            (updated {formatDate(p.secretAccessKey.updatedAt)})
          </span>
        </div>
        {status.kind === 'tested' && (
          <div
            data-testid={`storage-test-result-${p.slug}`}
            className={`flex items-center gap-1 pt-1 ${
              status.result.ok ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {status.result.ok ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Test passed
                {typeof status.result.latencyMs === 'number'
                  ? ` (${status.result.latencyMs} ms)`
                  : ''}
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5" />
                Test failed: {status.result.error ?? 'unknown'}
              </>
            )}
          </div>
        )}
        {status.kind === 'error' && (
          <div
            data-testid={`storage-error-${p.slug}`}
            className="flex items-center gap-1 pt-1 text-red-600"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {status.message}
          </div>
        )}
        {status.kind === 'activated' && (
          <div
            data-testid={`storage-activated-msg-${p.slug}`}
            className="flex items-center gap-1 pt-1 text-green-600"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Active provider switched. New uploads will land in {p.displayName}.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
