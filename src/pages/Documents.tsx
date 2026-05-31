import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Header } from '@/components/layout';
import {
  Badge,
  Card,
  CardContent,
  EmptyState,
  Label,
  Select,
  TableSkeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import {
  adminDocumentsApi,
  documentTypeLabel,
  expiryBand,
  DOCUMENT_TYPE_LABEL,
  type DocumentOwnerType,
  type DocumentStatus,
  type DocumentType,
  type ExpiryBand,
} from '@/services/api/documents';

const STATUSES: DocumentStatus[] = ['pending', 'approved', 'rejected', 'expired'];
const OWNER_TYPES: DocumentOwnerType[] = ['user', 'vehicle', 'company'];
// All catalogued types, surfaced in the filter dropdown. Sorted by
// label so the picker reads naturally; the slug stays as the option
// value so the URL ?type=… matches the backend.
const DOC_TYPE_OPTIONS = (Object.keys(DOCUMENT_TYPE_LABEL) as DocumentType[])
  .slice()
  .sort((a, b) =>
    DOCUMENT_TYPE_LABEL[a].localeCompare(DOCUMENT_TYPE_LABEL[b]),
  );
const EXPIRY_WINDOWS = [
  { label: 'Any', value: '' },
  { label: 'Next 7 days', value: '7' },
  { label: 'Next 30 days', value: '30' },
  { label: 'Next 90 days', value: '90' },
];

export function DocumentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Cross-link entry: `/documents?ownerType=user&ownerId=<uuid>` from
  // DriverDetail / CompanyDetail. Filters are URL-driven so an admin
  // can bookmark / share a filtered view; pickers below mutate the
  // URL through setSearchParams.
  const ownerIdFilter = searchParams.get('ownerId') ?? '';
  const ownerTypeFromUrl =
    (searchParams.get('ownerType') as DocumentOwnerType | null) ?? '';
  const statusFromUrl =
    (searchParams.get('status') as DocumentStatus | null) ?? '';
  const typeFromUrl =
    (searchParams.get('type') as DocumentType | null) ?? '';
  const expiringFromUrl = searchParams.get('expiringInDays') ?? '';

  const setUrlParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const clearOwnerFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('ownerId');
    next.delete('ownerType');
    setSearchParams(next, { replace: true });
  };

  const params = useMemo(
    () => ({
      ...(statusFromUrl ? { status: statusFromUrl } : {}),
      ...(ownerTypeFromUrl ? { ownerType: ownerTypeFromUrl } : {}),
      ...(ownerIdFilter ? { ownerId: ownerIdFilter } : {}),
      ...(typeFromUrl ? { type: typeFromUrl } : {}),
      ...(expiringFromUrl ? { expiringInDays: Number(expiringFromUrl) } : {}),
    }),
    [
      statusFromUrl,
      ownerTypeFromUrl,
      ownerIdFilter,
      typeFromUrl,
      expiringFromUrl,
    ],
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
        {ownerIdFilter ? (
          <div
            data-testid="documents-owner-filter-chip"
            className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground">Filtered by owner:</span>
            <code className="font-mono text-xs">
              {ownerTypeFromUrl || 'any'}:{ownerIdFilter.slice(0, 8)}
            </code>
            <button
              type="button"
              data-testid="documents-owner-filter-clear"
              onClick={clearOwnerFilter}
              className="ml-auto text-xs underline text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        ) : null}

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="doc-status">Status</Label>
                <Select
                  id="doc-status"
                  data-testid="documents-filter-status"
                  value={statusFromUrl}
                  onChange={(e) => setUrlParam('status', e.target.value)}
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
                  value={ownerTypeFromUrl}
                  onChange={(e) => setUrlParam('ownerType', e.target.value)}
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
                <Label htmlFor="doc-type">Document type</Label>
                <Select
                  id="doc-type"
                  data-testid="documents-filter-type"
                  value={typeFromUrl}
                  onChange={(e) => setUrlParam('type', e.target.value)}
                >
                  <option value="">All</option>
                  {DOC_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {DOCUMENT_TYPE_LABEL[t]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="doc-expiry">Expires within</Label>
                <Select
                  id="doc-expiry"
                  data-testid="documents-filter-expiry"
                  value={expiringFromUrl}
                  onChange={(e) =>
                    setUrlParam('expiringInDays', e.target.value)
                  }
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
              <div className="p-4">
                <TableSkeleton rows={6} columns={6} />
              </div>
            ) : rows.length === 0 ? (
              <div className="p-4" data-testid="documents-empty">
                <EmptyState
                  icon={FileText}
                  title="No documents found"
                  description="No documents match the current filters. Adjust the status, owner type, or expiry band."
                />
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
                          <span className="font-medium">
                            {documentTypeLabel(d.type)}
                          </span>
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
