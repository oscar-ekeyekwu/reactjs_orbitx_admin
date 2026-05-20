import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Ban, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Header } from '@/components/layout';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@/components/ui';
import { adminCompaniesApi, type CompanyStatus } from '@/services/api/companies';
import { auditLogApi } from '@/services/api/audit-log';
import { CompanyStatusBadge } from './Companies';

export function CompanyDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reason, setReason] = useState('');

  const companyQuery = useQuery({
    queryKey: ['admin-company', id],
    queryFn: () => adminCompaniesApi.findOne(id),
    enabled: !!id,
  });
  const auditQuery = useQuery({
    queryKey: ['admin-company-audit', id],
    queryFn: () => auditLogApi.findByTarget('company', id),
    enabled: !!id,
  });

  const transitionMutation = useMutation({
    mutationFn: (args: { status: CompanyStatus; reason?: string }) =>
      adminCompaniesApi.updateStatus(id, args),
    onSuccess: () => {
      setSuspendOpen(false);
      setReason('');
      void queryClient.invalidateQueries({
        queryKey: ['admin-company', id],
      });
      void queryClient.invalidateQueries({
        queryKey: ['admin-company-audit', id],
      });
    },
  });

  const company = companyQuery.data;

  return (
    <div>
      <Header
        title={company?.legalName ?? 'Company'}
        subtitle={company ? `CAC ${company.cacNumber ?? '—'} · TIN ${company.tin ?? '—'}` : 'Loading…'}
      />

      <div className="p-6 space-y-4">
        <Link
          to="/companies"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Companies
        </Link>

        {companyQuery.isLoading || !company ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle
                      data-testid="company-detail-title"
                      className="flex items-center gap-2"
                    >
                      {company.legalName}
                      <CompanyStatusBadge status={company.status} />
                    </CardTitle>
                    <CardDescription>
                      Created{' '}
                      {format(new Date(company.createdAt), 'PPpp')} ·{' '}
                      {company.address ?? 'No address on file'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {company.status === 'suspended' ? (
                      <Button
                        data-testid="company-resume"
                        onClick={() =>
                          transitionMutation.mutate({
                            status: 'approved',
                            reason: 'Resumed by admin',
                          })
                        }
                        disabled={transitionMutation.isPending}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Resume
                      </Button>
                    ) : company.status === 'approved' ? (
                      <Button
                        variant="destructive"
                        data-testid="company-suspend"
                        onClick={() => setSuspendOpen(true)}
                        disabled={transitionMutation.isPending}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Suspend
                      </Button>
                    ) : (
                      <Badge variant="secondary">Pending review (use Approvals)</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <Field
                  label="Owner"
                  value={
                    company.createdByUser?.email ??
                    company.createdByUser?.name ??
                    company.createdBy.slice(0, 8)
                  }
                />
                <Field
                  label="Phone"
                  value={company.createdByUser?.phone ?? '—'}
                />
                <Field label="CAC number" value={company.cacNumber ?? '—'} />
                <Field label="TIN" value={company.tin ?? '—'} />
                <Field
                  label="Vehicles"
                  value={String(company.vehicleCount ?? 0)}
                />
                <Field
                  label="Drivers"
                  value={String(company.driverCount ?? 0)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Approval history</CardTitle>
                <CardDescription>
                  Every admin decision touching this company. Append-only.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {auditQuery.isLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner size="sm" />
                  </div>
                ) : (auditQuery.data ?? []).length === 0 ? (
                  <p
                    data-testid="company-audit-empty"
                    className="px-6 py-4 text-sm text-muted-foreground"
                  >
                    No decisions yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Decided</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Reviewer</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(auditQuery.data ?? []).map((row) => (
                        <TableRow
                          key={row.id}
                          data-testid={`company-audit-row-${row.id}`}
                        >
                          <TableCell className="text-xs whitespace-nowrap">
                            {format(new Date(row.decidedAt), 'PPp')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{row.action}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.reviewer?.email ?? row.reviewerId ?? 'system'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.reason ?? '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent data-testid="company-suspend-modal">
          <DialogHeader>
            <DialogTitle>Suspend {company?.legalName}?</DialogTitle>
            <DialogDescription>
              The company moves to <code>suspended</code>. Vehicles + drivers
              owned by it stop dispatching. A reason is required and lands in
              the audit ledger.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="company-suspend-reason">Reason</Label>
            <Textarea
              id="company-suspend-reason"
              data-testid="company-suspend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          {transitionMutation.isError && (
            <p
              data-testid="company-suspend-error"
              className="text-xs text-red-600"
            >
              {extractMessage(transitionMutation.error)}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              data-testid="company-suspend-submit"
              onClick={() =>
                transitionMutation.mutate({ status: 'suspended', reason })
              }
              disabled={reason.trim().length === 0 || transitionMutation.isPending}
            >
              Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function extractMessage(err: unknown): string {
  if (!err) return 'Action failed.';
  const apiMsg = (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  if (apiMsg) return apiMsg;
  if (err instanceof Error) return err.message;
  return 'Action failed.';
}
