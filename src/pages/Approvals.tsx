import { useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
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
  EmptyState,
  Label,
  Skeleton,
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

interface ConfirmModalState {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}

const EMPTY_CONFIRM: ConfirmModalState = {
  open: false,
  title: '',
  description: '',
  confirmLabel: 'Confirm',
  onConfirm: () => {},
};

export function ApprovalsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabKey | null) ?? 'drivers';
  const [rejectModal, setRejectModal] = useState<RejectModalState>(EMPTY_REJECT);
  const [confirmModal, setConfirmModal] =
    useState<ConfirmModalState>(EMPTY_CONFIRM);
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

  const openConfirm = (input: Omit<ConfirmModalState, 'open'>) =>
    setConfirmModal({ ...input, open: true });
  const closeConfirm = () => setConfirmModal(EMPTY_CONFIRM);
  const submitConfirm = () => {
    const cb = confirmModal.onConfirm;
    closeConfirm();
    cb();
  };

  const confirmApproveDriver = (id: string, label: string) =>
    openConfirm({
      title: 'Approve driver?',
      description: `${label} will be marked APPROVED. They can come online and start receiving orders.`,
      confirmLabel: 'Approve driver',
      onConfirm: () => approveDriver.mutate(id),
    });
  const confirmApproveVehicle = (id: string, label: string) =>
    openConfirm({
      title: 'Approve vehicle?',
      description: `${label} will be marked APPROVED. The owner can assign it to a driver.`,
      confirmLabel: 'Approve vehicle',
      onConfirm: () => approveVehicle.mutate(id),
    });
  const confirmApproveCompany = (id: string, label: string) =>
    openConfirm({
      title: 'Approve company?',
      description: `${label} will be marked APPROVED. The owner can onboard drivers and vehicles under it.`,
      confirmLabel: 'Approve company',
      onConfirm: () => approveCompany.mutate(id),
    });
  const confirmApproveDocument = (id: string, label: string) =>
    openConfirm({
      title: 'Approve document?',
      description: `${label} will be marked APPROVED. If this clears the last expired/pending requirement, the owner moves to ACTIVE automatically.`,
      confirmLabel: 'Approve document',
      onConfirm: () => approveDocument.mutate(id),
    });
  const confirmApproveBucket = (
    label: string,
    docIds: string[],
    bucketKey: string,
  ) =>
    openConfirm({
      title: `Approve all ${docIds.length} documents?`,
      description: `Every pending document for ${label} (${bucketKey.slice(0, 30)}) will be approved.`,
      confirmLabel: `Approve ${docIds.length}`,
      onConfirm: () => {
        for (const id of docIds) approveDocument.mutate(id);
      },
    });

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
      <Header title="Approvals" subtitle="Review pending drivers, vehicles, companies, and documents." />

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
          onApprove={confirmApproveDriver}
          onReject={(id) => openReject('drivers', id)}
          pendingApproveId={
            approveDriver.isPending ? (approveDriver.variables ?? null) : null
          }
        />
      )}
      {tab === 'vehicles' && (
        <VehiclesTab
          query={vehiclesQuery}
          onApprove={confirmApproveVehicle}
          onReject={(id) => openReject('vehicles', id)}
          pendingApproveId={
            approveVehicle.isPending
              ? (approveVehicle.variables ?? null)
              : null
          }
        />
      )}
      {tab === 'companies' && (
        <CompaniesTab
          query={companiesQuery}
          onApprove={confirmApproveCompany}
          onReject={(id) => openReject('companies', id)}
          pendingApproveId={
            approveCompany.isPending
              ? (approveCompany.variables ?? null)
              : null
          }
        />
      )}
      {tab === 'documents' && (
        <DocumentsTab
          query={documentsQuery}
          onApprove={confirmApproveDocument}
          onApproveBucket={confirmApproveBucket}
          onReject={(id) => openReject('documents', id)}
          onView={openDocumentViewer}
          pendingApproveId={
            approveDocument.isPending
              ? (approveDocument.variables ?? null)
              : null
          }
          anyApprovePending={approveDocument.isPending}
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

      <Dialog
        open={confirmModal.open}
        onOpenChange={(open) => (open ? null : closeConfirm())}
      >
        <DialogContent data-testid="approvals-confirm-modal">
          <DialogHeader>
            <DialogTitle>{confirmModal.title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmModal.description}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={closeConfirm}>
              Cancel
            </Button>
            <Button
              data-testid="approvals-confirm-submit"
              onClick={submitConfirm}
            >
              {confirmModal.confirmLabel}
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
  emptyTitle,
  emptyDescription,
  children,
}: {
  isLoading: boolean;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading queue">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }
  if (isEmpty) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title={emptyTitle}
        description={emptyDescription}
      />
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
  pendingApproveId,
}: {
  query: QueryResult<{ items: PendingDriver[]; total: number }>;
  onApprove: (id: string, label: string) => void;
  onReject: (id: string) => void;
  pendingApproveId: string | null;
}) {
  const items = query.data?.items ?? [];
  return (
    <QueueShell
      isLoading={query.isLoading}
      isEmpty={items.length === 0}
      emptyTitle="No drivers waiting"
      emptyDescription="Every driver who's submitted their setup is approved. Newcomers will land here after they finish onboarding in the mobile app."
    >
      {items.map((d) => {
        const label =
          `${d.user?.first_name ?? ''} ${d.user?.last_name ?? ''}`.trim() ||
          'this driver';
        const pending = pendingApproveId === d.id;
        return (
          <Card key={d.id} data-testid={`approvals-driver-row-${d.id}`}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
                  disabled={pending}
                  onClick={() => onApprove(d.id, label)}
                >
                  {pending ? 'Approving…' : 'Approve'}
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
        );
      })}
    </QueueShell>
  );
}

function VehiclesTab({
  query,
  onApprove,
  onReject,
  pendingApproveId,
}: {
  query: QueryResult<{ items: PendingVehicle[]; total: number }>;
  onApprove: (id: string, label: string) => void;
  onReject: (id: string) => void;
  pendingApproveId: string | null;
}) {
  const items = query.data?.items ?? [];
  return (
    <QueueShell
      isLoading={query.isLoading}
      isEmpty={items.length === 0}
      emptyTitle="No vehicles waiting"
      emptyDescription="No vehicles are pending review. Submitted vehicles from drivers and companies show up here."
    >
      {items.map((v) => {
        const label = `${v.plate} (${v.type})`;
        const pending = pendingApproveId === v.id;
        return (
          <Card key={v.id} data-testid={`approvals-vehicle-row-${v.id}`}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
                  disabled={pending}
                  onClick={() => onApprove(v.id, label)}
                >
                  {pending ? 'Approving…' : 'Approve'}
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
        );
      })}
    </QueueShell>
  );
}

function CompaniesTab({
  query,
  onApprove,
  onReject,
  pendingApproveId,
}: {
  query: QueryResult<{ items: PendingCompany[]; total: number }>;
  onApprove: (id: string, label: string) => void;
  onReject: (id: string) => void;
  pendingApproveId: string | null;
}) {
  const items = query.data?.items ?? [];
  return (
    <QueueShell
      isLoading={query.isLoading}
      isEmpty={items.length === 0}
      emptyTitle="No companies waiting"
      emptyDescription="No companies are pending review. Company sign-ups appear here once they submit their CAC and ownership details."
    >
      {items.map((c) => {
        const pending = pendingApproveId === c.id;
        return (
          <Card key={c.id} data-testid={`approvals-company-row-${c.id}`}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
                  disabled={pending}
                  onClick={() => onApprove(c.id, c.legalName)}
                >
                  {pending ? 'Approving…' : 'Approve'}
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
        );
      })}
    </QueueShell>
  );
}

interface DocumentBucket {
  ownerType: PendingDocument['ownerType'];
  ownerId: string;
  docs: PendingDocument[];
}

function groupDocsByOwner(docs: PendingDocument[]): DocumentBucket[] {
  const buckets = new Map<string, DocumentBucket>();
  for (const d of docs) {
    const key = `${d.ownerType}:${d.ownerId}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { ownerType: d.ownerType, ownerId: d.ownerId, docs: [] };
      buckets.set(key, bucket);
    }
    bucket.docs.push(d);
  }
  // Stable order: oldest-upload-first per bucket, buckets sorted by
  // earliest pending doc so the most-overdue review surfaces at the top.
  for (const bucket of buckets.values()) {
    bucket.docs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  return Array.from(buckets.values()).sort(
    (a, b) => a.docs[0].createdAt.localeCompare(b.docs[0].createdAt),
  );
}

function DocumentsTab({
  query,
  onApprove,
  onApproveBucket,
  onReject,
  onView,
  pendingApproveId,
  anyApprovePending,
}: {
  query: QueryResult<PendingDocument[]>;
  onApprove: (id: string, label: string) => void;
  onApproveBucket: (label: string, docIds: string[], bucketKey: string) => void;
  onReject: (id: string) => void;
  onView: (doc: PendingDocument) => void;
  pendingApproveId: string | null;
  anyApprovePending: boolean;
}) {
  const items = query.data ?? [];
  const buckets = useMemo(() => groupDocsByOwner(items), [items]);

  return (
    <QueueShell
      isLoading={query.isLoading}
      isEmpty={items.length === 0}
      emptyTitle="No documents waiting"
      emptyDescription="No documents are pending review. Drivers' KYC uploads appear here grouped by owner."
    >
      {buckets.map((bucket) => {
        const bucketKey = `${bucket.ownerType}:${bucket.ownerId}`;
        const bucketLabel = `${bucket.ownerType} ${bucket.ownerId.slice(0, 8)}`;
        return (
          <Card
            key={bucketKey}
            data-testid={`approvals-document-bucket-${bucketKey}`}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {bucket.ownerType}
                    </Badge>
                    <span className="font-semibold">
                      {bucket.ownerId.slice(0, 8)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {bucket.docs.length} document
                    {bucket.docs.length === 1 ? '' : 's'} pending review
                  </p>
                </div>
                <Button
                  variant="outline"
                  data-testid={`approvals-document-approve-all-${bucketKey}`}
                  disabled={anyApprovePending}
                  onClick={() =>
                    onApproveBucket(
                      bucketLabel,
                      bucket.docs.map((d) => d.id),
                      bucketKey,
                    )
                  }
                >
                  {anyApprovePending ? 'Approving…' : 'Approve all'}
                </Button>
              </div>
              <div className="border-t pt-3 space-y-2">
                {bucket.docs.map((d) => {
                  const pending = pendingApproveId === d.id;
                  return (
                    <div
                      key={d.id}
                      data-testid={`approvals-document-row-${d.id}`}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{d.type}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded {new Date(d.createdAt).toLocaleString()}
                          {d.expiryDate ? ` · expires ${d.expiryDate}` : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`approvals-document-view-${d.id}`}
                          onClick={() => void onView(d)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          data-testid={`approvals-document-approve-${d.id}`}
                          disabled={pending}
                          onClick={() => onApprove(d.id, d.type)}
                        >
                          {pending ? 'Approving…' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`approvals-document-reject-${d.id}`}
                          onClick={() => onReject(d.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </QueueShell>
  );
}

export default ApprovalsPage;
