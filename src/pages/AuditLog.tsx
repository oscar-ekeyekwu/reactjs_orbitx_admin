import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Download, ShieldCheck, History } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
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
  auditDecisionsToCsv,
  auditLogApi,
  type ApprovalAction,
  type ApprovalTargetType,
  type AuditDecision,
} from '@/services/api/audit-log';

const TARGET_TYPES: ApprovalTargetType[] = [
  'driver',
  'company',
  'vehicle',
  'document',
  'order',
  'storage_provider',
  'storage_migration',
];

const ACTIONS: ApprovalAction[] = [
  'approve',
  'reject',
  'suspend',
  'resume',
  'bootstrap_seed',
  'create',
  'update',
  'delete',
  'activate',
  'pause',
];

const PAGE_SIZE = 50;

export function AuditLogPage() {
  const [targetType, setTargetType] = useState<ApprovalTargetType | ''>('');
  const [action, setAction] = useState<ApprovalAction | ''>('');
  const [reviewerId, setReviewerId] = useState('');
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  // Cross-link entry: `/audit-log?targetId=<uuid>` from DriverDetail
  // / CompanyDetail. The backend filter is exact-id; no fuzzy match.
  const targetIdFilter = searchParams.get('targetId') ?? '';
  const clearTargetFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('targetId');
    setSearchParams(next, { replace: true });
  };

  const params = useMemo(
    () => ({
      ...(targetType ? { targetType } : {}),
      ...(targetIdFilter ? { targetId: targetIdFilter } : {}),
      ...(action ? { action } : {}),
      ...(reviewerId ? { reviewerId } : {}),
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    [targetType, targetIdFilter, action, reviewerId, page],
  );

  const auditQuery = useQuery({
    queryKey: ['audit-log', params],
    queryFn: () => auditLogApi.list(params),
  });

  const rows = auditQuery.data?.items ?? [];
  const total = auditQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleExportCsv = () => {
    const csv = auditDecisionsToCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `audit-log-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Header
        title="Audit Log"
        subtitle="Append-only record of every admin decision. Compliance evidence is read-only by design."
      />

      <div className="p-6 space-y-4">
        {targetIdFilter ? (
          <div
            data-testid="audit-target-filter-chip"
            className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground">Filtered by target:</span>
            <code className="font-mono text-xs">
              {targetIdFilter.slice(0, 8)}
            </code>
            <button
              type="button"
              data-testid="audit-target-filter-clear"
              onClick={clearTargetFilter}
              className="ml-auto text-xs underline text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        ) : null}

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="audit-target-type">Target type</Label>
                <Select
                  id="audit-target-type"
                  data-testid="audit-filter-target-type"
                  value={targetType}
                  onChange={(e) => {
                    setTargetType(e.target.value as ApprovalTargetType | '');
                    setPage(1);
                  }}
                >
                  <option value="">All</option>
                  {TARGET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="audit-action">Action</Label>
                <Select
                  id="audit-action"
                  data-testid="audit-filter-action"
                  value={action}
                  onChange={(e) => {
                    setAction(e.target.value as ApprovalAction | '');
                    setPage(1);
                  }}
                >
                  <option value="">All</option>
                  {ACTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="audit-reviewer">Reviewer id</Label>
                <Input
                  id="audit-reviewer"
                  data-testid="audit-filter-reviewer"
                  placeholder="uuid (optional)"
                  value={reviewerId}
                  onChange={(e) => {
                    setReviewerId(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="gap-2"
                  data-testid="audit-export-csv"
                  onClick={handleExportCsv}
                  disabled={rows.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {auditQuery.isLoading ? (
              <div className="p-4">
                <TableSkeleton rows={8} columns={5} />
              </div>
            ) : rows.length === 0 ? (
              <div className="p-4" data-testid="audit-empty">
                <EmptyState
                  icon={History}
                  title="No audit rows"
                  description="No approval decisions match the current filters. Try changing the target type, action, or date range."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Decided at</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <AuditRow key={row.id} row={row} />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {total} rows
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function AuditRow({ row }: { row: AuditDecision }) {
  return (
    <TableRow data-testid={`audit-row-${row.id}`}>
      <TableCell className="whitespace-nowrap text-xs">
        {new Date(row.decidedAt).toLocaleString()}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="font-mono text-xs">{row.targetType}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {row.targetId.slice(0, 8)}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <ActionBadge action={row.action} />
      </TableCell>
      <TableCell className="text-xs">{formatReviewer(row)}</TableCell>
      <TableCell className="max-w-md text-xs">{row.reason ?? '—'}</TableCell>
    </TableRow>
  );
}

function formatReviewer(row: AuditDecision): string {
  if (row.reviewer?.name) return row.reviewer.name;
  const composed = [row.reviewer?.first_name, row.reviewer?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (composed.length > 0) return composed;
  if (row.reviewer?.email) return row.reviewer.email;
  if (row.reviewerId) return row.reviewerId;
  return 'system';
}

function ActionBadge({ action }: { action: ApprovalAction }) {
  const variant: 'default' | 'secondary' | 'destructive' =
    action === 'reject' || action === 'suspend' || action === 'delete'
      ? 'destructive'
      : action === 'approve' || action === 'activate' || action === 'resume'
        ? 'default'
        : 'secondary';
  return <Badge variant={variant}>{action}</Badge>;
}
