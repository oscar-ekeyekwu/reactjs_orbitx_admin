import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Header } from '@/components/layout';
import {
  Badge,
  Card,
  CardContent,
  Label,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import {
  adminDocumentsApi,
  expiryBand,
  type DocumentOwnerType,
  type DocumentStatus,
  type ExpiryBand,
} from '@/services/api/documents';

const STATUSES: DocumentStatus[] = ['pending', 'approved', 'rejected', 'expired'];
const OWNER_TYPES: DocumentOwnerType[] = ['user', 'vehicle', 'company'];
const EXPIRY_WINDOWS = [
  { label: 'Any', value: '' },
  { label: 'Next 7 days', value: '7' },
  { label: 'Next 30 days', value: '30' },
  { label: 'Next 90 days', value: '90' },
];

export function DocumentsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<DocumentStatus | ''>('');
  const [ownerType, setOwnerType] = useState<DocumentOwnerType | ''>('');
  const [window, setWindow] = useState('');

  const params = useMemo(
    () => ({
      ...(status ? { status } : {}),
      ...(ownerType ? { ownerType } : {}),
      ...(window ? { expiringInDays: Number(window) } : {}),
    }),
    [status, ownerType, window],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['admin-documents', params],
    queryFn: () => adminDocumentsApi.list(params),
  });

  const rows = data ?? [];

  return (
    <div>
      <Header
        title="Documents"
        subtitle="KYC + compliance docs across all owners, with traffic-light expiry."
      />

      <div className="p-6 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="doc-status">Status</Label>
                <Select
                  id="doc-status"
                  data-testid="documents-filter-status"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as DocumentStatus | '')
                  }
                >
                  <option value="">All</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="doc-owner-type">Owner type</Label>
                <Select
                  id="doc-owner-type"
                  data-testid="documents-filter-owner-type"
                  value={ownerType}
                  onChange={(e) =>
                    setOwnerType(e.target.value as DocumentOwnerType | '')
                  }
                >
                  <option value="">All</option>
                  {OWNER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="doc-expiry">Expires within</Label>
                <Select
                  id="doc-expiry"
                  data-testid="documents-filter-expiry"
                  value={window}
                  onChange={(e) => setWindow(e.target.value)}
                >
                  {EXPIRY_WINDOWS.map((w) => (
                    <option key={w.label} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : rows.length === 0 ? (
              <div
                data-testid="documents-empty"
                className="py-12 text-center text-sm text-muted-foreground"
              >
                No documents match the current filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((d) => (
                    <TableRow
                      key={d.id}
                      data-testid={`documents-row-${d.id}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/documents/${d.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{d.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {d.ownerName ?? `${d.ownerType}:${d.ownerId.slice(0, 8)}`}
                      </TableCell>
                      <TableCell>
                        <DocStatusBadge status={d.status} />
                      </TableCell>
                      <TableCell>
                        <ExpiryPill expiryDate={d.expiryDate} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {format(new Date(d.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DocStatusBadge({ status }: { status: DocumentStatus }) {
  const variant: 'default' | 'secondary' | 'destructive' =
    status === 'approved'
      ? 'default'
      : status === 'rejected' || status === 'expired'
        ? 'destructive'
        : 'secondary';
  return <Badge variant={variant}>{status}</Badge>;
}

export function ExpiryPill({
  expiryDate,
}: {
  expiryDate: string | null;
}) {
  const band = expiryBand(expiryDate);
  return (
    <span
      data-testid={`expiry-pill-${band}`}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${BAND_CLASSES[band]}`}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${BAND_DOT[band]}`}
      />
      {expiryDate
        ? format(new Date(expiryDate), 'MMM d, yyyy')
        : 'No expiry'}
    </span>
  );
}

const BAND_CLASSES: Record<ExpiryBand, string> = {
  green: 'bg-green-50 text-green-800',
  amber: 'bg-amber-50 text-amber-800',
  red: 'bg-red-50 text-red-800',
  gray: 'bg-gray-100 text-gray-700',
  none: 'bg-gray-50 text-gray-500',
};

const BAND_DOT: Record<ExpiryBand, string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  gray: 'bg-gray-400',
  none: 'bg-gray-300',
};
