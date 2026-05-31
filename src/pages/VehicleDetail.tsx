import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Header } from '@/components/layout';
import {
  Badge,
  Breadcrumb,
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
import {
  adminVehiclesApi,
  type VehicleStatus,
} from '@/services/api/vehicles';
import { auditLogApi } from '@/services/api/audit-log';
import { adminDocumentsApi, documentTypeLabel } from '@/services/api/documents';
import { VehicleStatusBadge } from './Vehicles';

export function VehicleDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reason, setReason] = useState('');

  const vehicleQuery = useQuery({
    queryKey: ['admin-vehicle', id],
    queryFn: () => adminVehiclesApi.findOne(id),
    enabled: !!id,
  });
  const auditQuery = useQuery({
    queryKey: ['admin-vehicle-audit', id],
    queryFn: () => auditLogApi.findByTarget('vehicle', id),
    enabled: !!id,
  });
  const docsQuery = useQuery({
    queryKey: ['admin-vehicle-docs', id],
    queryFn: () =>
      adminDocumentsApi.list({ ownerType: 'vehicle', ownerId: id }),
    enabled: !!id,
  });
  const transitionMutation = useMutation({
    mutationFn: (args: { status: VehicleStatus; reason?: string }) =>
      adminVehiclesApi.updateStatus(id, args),
    onSuccess: () => {
      setSuspendOpen(false);
      setReason('');
      void queryClient.invalidateQueries({
        queryKey: ['admin-vehicle', id],
      });
      void queryClient.invalidateQueries({
        queryKey: ['admin-vehicle-audit', id],
      });
    },
  });

  const vehicle = vehicleQuery.data;
  const canSuspend =
    vehicle?.status === 'approved' || vehicle?.status === 'active';
  const isSuspended = vehicle?.status === 'suspended';

  return (
    <div>
      <Header
        title={vehicle ? vehicle.plate : 'Vehicle'}
        subtitle={vehicle ? `${vehicle.type} · ${vehicle.color ?? 'No color'}` : 'Loading…'}
      />

      <div className="p-4 space-y-4 md:p-6">
        <Breadcrumb
          items={[
            { label: 'Vehicles', href: '/vehicles' },
            { label: vehicle ? vehicle.plate : 'Vehicle' },
          ]}
        />

        {vehicleQuery.isLoading || !vehicle ? (
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
                      data-testid="vehicle-detail-title"
                      className="flex items-center gap-2"
                    >
                      {vehicle.plate}
                      <VehicleStatusBadge status={vehicle.status} />
                    </CardTitle>
                    <CardDescription>
                      Owner: {vehicle.owner.type} · {vehicle.owner.id.slice(0, 8)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {isSuspended ? (
                      <Button
                        data-testid="vehicle-resume"
                        onClick={() =>
                          transitionMutation.mutate({
                            status: 'active',
                            reason: 'Resumed by admin',
                          })
                        }
                        disabled={transitionMutation.isPending}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Resume
                      </Button>
                    ) : canSuspend ? (
                      <Button
                        variant="destructive"
                        data-testid="vehicle-suspend"
                        onClick={() => setSuspendOpen(true)}
                        disabled={transitionMutation.isPending}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Suspend
                      </Button>
                    ) : (
                      <Badge variant="secondary">
                        Pending review (use Approvals)
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <Field label="Plate" value={vehicle.plate} />
                <Field label="Type" value={vehicle.type} />
                <Field label="Color" value={vehicle.color ?? '—'} />
                <Field
                  label="Approved"
                  value={
                    vehicle.approvedAt
                      ? format(new Date(vehicle.approvedAt), 'PPp')
                      : 'Not approved'
                  }
                />
                <Field
                  label="Registered"
                  value={format(new Date(vehicle.createdAt), 'PPp')}
                />
                <Field
                  label="Updated"
                  value={format(new Date(vehicle.updatedAt), 'PPp')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vehicle documents</CardTitle>
                <CardDescription>
                  Vehicle license, insurance, road worthiness, and the
                  registration-plate photo uploaded by the driver.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {docsQuery.isLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner size="sm" />
                  </div>
                ) : (docsQuery.data ?? []).length === 0 ? (
                  <p
                    data-testid="vehicle-docs-empty"
                    className="px-6 py-4 text-sm text-muted-foreground"
                  >
                    No documents uploaded for this vehicle yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Uploaded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(docsQuery.data ?? []).map((d) => (
                        <TableRow
                          key={d.id}
                          data-testid={`vehicle-doc-row-${d.id}`}
                        >
                          <TableCell className="font-medium">
                            {documentTypeLabel(d.type)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                d.status === 'approved'
                                  ? 'success'
                                  : d.status === 'rejected' ||
                                      d.status === 'expired'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {d.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {d.expiryDate ?? '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(d.createdAt), 'MMM d, yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Approval history</CardTitle>
                <CardDescription>
                  Every state-machine transition for this vehicle.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {auditQuery.isLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner size="sm" />
                  </div>
                ) : (auditQuery.data ?? []).length === 0 ? (
                  <p
                    data-testid="vehicle-audit-empty"
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
                          data-testid={`vehicle-audit-row-${row.id}`}
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
        <DialogContent data-testid="vehicle-suspend-modal">
          <DialogHeader>
            <DialogTitle>Suspend {vehicle?.plate}?</DialogTitle>
            <DialogDescription>
              Removes the vehicle from dispatch until you resume it. Reason
              is required and lands in the audit ledger.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="vehicle-suspend-reason">Reason</Label>
            <Textarea
              id="vehicle-suspend-reason"
              data-testid="vehicle-suspend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              data-testid="vehicle-suspend-submit"
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
