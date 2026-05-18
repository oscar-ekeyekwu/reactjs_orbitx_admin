import { useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Spinner,
  Textarea,
} from '@/components/ui';
import {
  approvalsApi,
  type PendingCompany,
  type PendingDocument,
  type PendingDriver,
  type PendingVehicle,
} from '@/services/api';

type TabKey = 'drivers' | 'vehicles' | 'companies' | 'documents';

const TAB_LABEL: Record<TabKey, string> = {
  drivers: 'Drivers',
  vehicles: 'Vehicles',
  companies: 'Companies',
  documents: 'Documents',
};

interface RejectModalState {
  open: boolean;
  kind: TabKey;
  id: string;
  reason: string;
}

const EMPTY_REJECT: RejectModalState = {
  open: false,
  kind: 'drivers',
  id: '',
  reason: '',
};

export function ApprovalsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabKey | null) ?? 'drivers';
  const [rejectModal, setRejectModal] = useState<RejectModalState>(EMPTY_REJECT);
  const queryClient = useQueryClient();

  const driversQuery = useQuery({
    queryKey: ['approvals', 'drivers'],
    queryFn: () => approvalsApi.listPendingDrivers(),
  });
  const vehiclesQuery = useQuery({
    queryKey: ['approvals', 'vehicles'],
    queryFn: () => approvalsApi.listPendingVehicles(),
  });
  const companiesQuery = useQuery({
    queryKey: ['approvals', 'companies'],
    queryFn: () => approvalsApi.listPendingCompanies(),
  });
  const documentsQuery = useQuery({
    queryKey: ['approvals', 'documents'],
    queryFn: () => approvalsApi.listPendingDocuments(),
  });

  const invalidate = (kind: TabKey) =>
    queryClient.invalidateQueries({ queryKey: ['approvals', kind] });

  const approveDriver = useMutation({
    mutationFn: (id: string) => approvalsApi.approveDriver(id),
    onSuccess: () => invalidate('drivers'),
  });
  const rejectDriver = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      approvalsApi.rejectDriver(id, reason),
    onSuccess: () => invalidate('drivers'),
  });
  const approveVehicle = useMutation({
    mutationFn: (id: string) => approvalsApi.approveVehicle(id),
    onSuccess: () => invalidate('vehicles'),
  });
  const rejectVehicle = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      approvalsApi.rejectVehicle(id, reason),
    onSuccess: () => invalidate('vehicles'),
  });
  const approveCompany = useMutation({
    mutationFn: (id: string) => approvalsApi.approveCompany(id),
    onSuccess: () => invalidate('companies'),
  });
  const suspendCompany = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      approvalsApi.suspendCompany(id, reason),
    onSuccess: () => invalidate('companies'),
  });
  const approveDocument = useMutation({
    mutationFn: (id: string) => approvalsApi.approveDocument(id),
    onSuccess: () => invalidate('documents'),
  });
  const rejectDocument = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      approvalsApi.rejectDocument(id, reason),
    onSuccess: () => invalidate('documents'),
  });

  const counts = useMemo(
    () => ({
      drivers: driversQuery.data?.total ?? 0,
      vehicles: vehiclesQuery.data?.total ?? 0,
      companies: companiesQuery.data?.total ?? 0,
      documents: documentsQuery.data?.length ?? 0,
    }),
    [
      driversQuery.data,
      vehiclesQuery.data,
      companiesQuery.data,
      documentsQuery.data,
    ],
  );

  const setTab = (next: TabKey) => {
    const updated = new URLSearchParams(params);
    updated.set('tab', next);
    setParams(updated);
  };

  const openReject = (kind: TabKey, id: string) =>
    setRejectModal({ open: true, kind, id, reason: '' });
  const closeReject = () => setRejectModal(EMPTY_REJECT);

  const submitReject = () => {
    if (!rejectModal.reason.trim()) return;
    const arg = { id: rejectModal.id, reason: rejectModal.reason.trim() };
    switch (rejectModal.kind) {
      case 'drivers':
        rejectDriver.mutate(arg);
        break;
      case 'vehicles':
        rejectVehicle.mutate(arg);
        break;
      case 'companies':
        suspendCompany.mutate(arg);
        break;
      case 'documents':
        rejectDocument.mutate(arg);
        break;
    }
    closeReject();
  };

  const openDocumentViewer = async (doc: PendingDocument) => {
    try {
      const url = await approvalsApi.getDocumentViewUrl(doc.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // Failure path: token expired / network blip — fall through.
    }
  };

  return (
    <>
      <Header title="Approvals" description="Review pending drivers, vehicles, companies, and documents." />

      <div
        role="tablist"
        aria-label="Approval queues"
        data-testid="approvals-tabs"
        className="mb-4 flex gap-2 border-b"
      >
        {(Object.keys(TAB_LABEL) as TabKey[]).map((key) => (
          <button
            key={key}
            role="tab"
            data-testid={`approvals-tab-${key}`}
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 -mb-px border-b-2 ${
              tab === key
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            {TAB_LABEL[key]}{' '}
            <Badge
              variant="secondary"
              data-testid={`approvals-count-${key}`}
              className="ml-1"
            >
              {counts[key]}
            </Badge>
          </button>
        ))}
      </div>

      {tab === 'drivers' && (
        <DriversTab
          query={driversQuery}
          onApprove={(id) => approveDriver.mutate(id)}
          onReject={(id) => openReject('drivers', id)}
        />
      )}
      {tab === 'vehicles' && (
        <VehiclesTab
          query={vehiclesQuery}
          onApprove={(id) => approveVehicle.mutate(id)}
          onReject={(id) => openReject('vehicles', id)}
        />
      )}
      {tab === 'companies' && (
        <CompaniesTab
          query={companiesQuery}
          onApprove={(id) => approveCompany.mutate(id)}
          onReject={(id) => openReject('companies', id)}
        />
      )}
      {tab === 'documents' && (
        <DocumentsTab
          query={documentsQuery}
          onApprove={(id) => approveDocument.mutate(id)}
          onReject={(id) => openReject('documents', id)}
          onView={openDocumentViewer}
        />
      )}

      <Dialog
        open={rejectModal.open}
        onOpenChange={(open) => (open ? null : closeReject())}
      >
        <DialogContent data-testid="approvals-reject-modal">
          <DialogHeader>
            <DialogTitle>
              Reject {TAB_LABEL[rejectModal.kind].slice(0, -1).toLowerCase()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason (required)</Label>
            <Textarea
              id="reject-reason"
              data-testid="approvals-reject-reason"
              value={rejectModal.reason}
              onChange={(e) =>
                setRejectModal((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder="Explain why so the owner can address it."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeReject}>
              Cancel
            </Button>
            <Button
              data-testid="approvals-reject-submit"
              variant="destructive"
              disabled={!rejectModal.reason.trim()}
              onClick={submitReject}
            >
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function QueueShell({
  isLoading,
  isEmpty,
  emptyMessage,
  children,
}: {
  isLoading: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner />
      </div>
    );
  }
  if (isEmpty) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }
  return <div className="space-y-2">{children}</div>;
}

interface QueryResult<T> {
  data?: T;
  isLoading: boolean;
}

function DriversTab({
  query,
  onApprove,
  onReject,
}: {
  query: QueryResult<{ items: PendingDriver[]; total: number }>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const items = query.data?.items ?? [];
  return (
    <QueueShell
      isLoading={query.isLoading}
      isEmpty={items.length === 0}
      emptyMessage="No drivers waiting for approval."
    >
      {items.map((d) => (
        <Card
          key={d.id}
          data-testid={`approvals-driver-row-${d.id}`}
        >
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">
                {d.user?.first_name ?? ''} {d.user?.last_name ?? ''}{' '}
                {!d.user?.first_name && !d.user?.last_name && '(unnamed)'}
              </p>
              <p className="text-sm text-muted-foreground">
                {d.user?.email ?? '—'} · {d.user?.phone ?? '—'} ·{' '}
                {d.accountType}
                {d.company ? ` · ${d.company.legalName}` : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                Submitted {new Date(d.updatedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                data-testid={`approvals-driver-approve-${d.id}`}
                onClick={() => onApprove(d.id)}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                data-testid={`approvals-driver-reject-${d.id}`}
                onClick={() => onReject(d.id)}
              >
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </QueueShell>
  );
}

function VehiclesTab({
  query,
  onApprove,
  onReject,
}: {
  query: QueryResult<{ items: PendingVehicle[]; total: number }>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const items = query.data?.items ?? [];
  return (
    <QueueShell
      isLoading={query.isLoading}
      isEmpty={items.length === 0}
      emptyMessage="No vehicles waiting for approval."
    >
      {items.map((v) => (
        <Card key={v.id} data-testid={`approvals-vehicle-row-${v.id}`}>
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">
                {v.plate} · {v.type}
              </p>
              <p className="text-sm text-muted-foreground">
                Owner {v.owner.type} {v.owner.id.slice(0, 8)} ·{' '}
                {v.color ?? 'no color'}
              </p>
              <p className="text-xs text-muted-foreground">
                Submitted {new Date(v.updatedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                data-testid={`approvals-vehicle-approve-${v.id}`}
                onClick={() => onApprove(v.id)}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                data-testid={`approvals-vehicle-reject-${v.id}`}
                onClick={() => onReject(v.id)}
              >
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </QueueShell>
  );
}

function CompaniesTab({
  query,
  onApprove,
  onReject,
}: {
  query: QueryResult<{ items: PendingCompany[]; total: number }>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const items = query.data?.items ?? [];
  return (
    <QueueShell
      isLoading={query.isLoading}
      isEmpty={items.length === 0}
      emptyMessage="No companies waiting for approval."
    >
      {items.map((c) => (
        <Card key={c.id} data-testid={`approvals-company-row-${c.id}`}>
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{c.legalName}</p>
              <p className="text-sm text-muted-foreground">
                CAC {c.cacNumber ?? '—'} · TIN {c.tin ?? '—'}
              </p>
              <p className="text-xs text-muted-foreground">
                Submitted {new Date(c.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                data-testid={`approvals-company-approve-${c.id}`}
                onClick={() => onApprove(c.id)}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                data-testid={`approvals-company-reject-${c.id}`}
                onClick={() => onReject(c.id)}
              >
                Suspend
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </QueueShell>
  );
}

function DocumentsTab({
  query,
  onApprove,
  onReject,
  onView,
}: {
  query: QueryResult<PendingDocument[]>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onView: (doc: PendingDocument) => void;
}) {
  const items = query.data ?? [];
  return (
    <QueueShell
      isLoading={query.isLoading}
      isEmpty={items.length === 0}
      emptyMessage="No documents waiting for approval."
    >
      {items.map((d) => (
        <Card key={d.id} data-testid={`approvals-document-row-${d.id}`}>
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{d.type}</p>
              <p className="text-sm text-muted-foreground">
                Owner {d.ownerType} {d.ownerId.slice(0, 8)} ·{' '}
                {d.expiryDate ? `expires ${d.expiryDate}` : 'no expiry'}
              </p>
              <p className="text-xs text-muted-foreground">
                Uploaded {new Date(d.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                data-testid={`approvals-document-view-${d.id}`}
                onClick={() => void onView(d)}
              >
                View
              </Button>
              <Button
                data-testid={`approvals-document-approve-${d.id}`}
                onClick={() => onApprove(d.id)}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                data-testid={`approvals-document-reject-${d.id}`}
                onClick={() => onReject(d.id)}
              >
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </QueueShell>
  );
}

export default ApprovalsPage;
