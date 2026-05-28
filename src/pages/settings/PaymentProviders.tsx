import { useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Breadcrumb,
  Button,
  Card,
  CardContent,
  Spinner,
} from '@/components/ui';
import {
  paymentProvidersApi,
  type CreatePaymentProviderDto,
  type PaymentProvider,
  type PaymentProviderTestResult,
  type UpdatePaymentProviderDto,
} from '@/services/api';
import { ProviderCard } from './payment-providers/ProviderCard';
import { ProviderEditorDialog } from './payment-providers/ProviderEditorDialog';
import { DeleteConfirmDialog } from './payment-providers/DeleteConfirmDialog';
import { EMPTY_DRAFT, type ProviderFormDraft } from './payment-providers/types';

export function PaymentProvidersPage() {
  const queryClient = useQueryClient();
  const providersQuery = useQuery({
    queryKey: ['payment-providers'],
    queryFn: paymentProvidersApi.list,
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProviderFormDraft>(EMPTY_DRAFT);

  const [testResults, setTestResults] = useState<
    Record<string, PaymentProviderTestResult | undefined>
  >({});
  const [confirmDelete, setConfirmDelete] = useState<PaymentProvider | null>(
    null,
  );

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  const createMutation = useMutation({
    mutationFn: (dto: CreatePaymentProviderDto) =>
      paymentProvidersApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
      closeEditor();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdatePaymentProviderDto;
    }) => paymentProvidersApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
      closeEditor();
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => paymentProvidersApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentProvidersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
      setConfirmDelete(null);
    },
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => paymentProvidersApi.test(id),
    onSuccess: (result, id) => {
      setTestResults((prev) => ({ ...prev, [id]: result }));
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setEditorOpen(true);
  };

  const openEdit = (row: PaymentProvider) => {
    setEditingId(row.id);
    setDraft({
      slug: row.slug,
      kind: row.kind,
      displayName: row.displayName,
      baseUrl: row.baseUrl,
      publicKey: row.publicKey ?? '',
      preferredBank: row.preferredBank ?? '',
      secretKey: '',
      webhookSecret: '',
      enabled: row.enabled,
    });
    setEditorOpen(true);
  };

  const submitDraft = () => {
    if (editingId) {
      const patch: UpdatePaymentProviderDto = {
        displayName: draft.displayName,
        baseUrl: draft.baseUrl,
        // null clears the field; empty string is meaningful for webhookSecret
        // (clears the dedicated secret), so we forward it as-is.
        publicKey: draft.publicKey === '' ? null : draft.publicKey,
        preferredBank:
          draft.preferredBank === '' ? null : draft.preferredBank,
        enabled: draft.enabled,
      };
      if (draft.secretKey) patch.secretKey = draft.secretKey;
      if (draft.webhookSecret !== '') patch.webhookSecret = draft.webhookSecret;
      updateMutation.mutate({ id: editingId, dto: patch });
      return;
    }
    const create: CreatePaymentProviderDto = {
      slug: draft.slug.trim(),
      kind: draft.kind,
      displayName: draft.displayName.trim(),
      baseUrl: draft.baseUrl.trim(),
      secretKey: draft.secretKey,
      enabled: draft.enabled,
    };
    if (draft.publicKey) create.publicKey = draft.publicKey.trim();
    if (draft.preferredBank) create.preferredBank = draft.preferredBank;
    if (draft.webhookSecret) create.webhookSecret = draft.webhookSecret;
    createMutation.mutate(create);
  };

  const isCreateValid =
    !!draft.slug &&
    !!draft.displayName &&
    !!draft.baseUrl &&
    draft.secretKey.length >= 8;

  const isEditValid =
    !!draft.displayName &&
    !!draft.baseUrl &&
    // For edits secretKey is optional (omit to keep existing cipher).
    (draft.secretKey === '' || draft.secretKey.length >= 8);

  const submitDisabled =
    (editingId ? !isEditValid : !isCreateValid) ||
    createMutation.isPending ||
    updateMutation.isPending;

  return (
    <div>
      <Header
        title="Payment Providers"
        subtitle="Pluggable gateway registry. Swap or rotate credentials without a redeploy."
      />

      <div className="p-4 space-y-6 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Breadcrumb
            items={[
              { label: 'Settings', href: '/settings' },
              { label: 'Payment Providers' },
            ]}
          />
          <Button onClick={openCreate} className="w-full gap-2 sm:w-auto">
            <PlusCircle className="h-4 w-4" /> Add provider
          </Button>
        </div>

        {providersQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : !providersQuery.data || providersQuery.data.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No payment providers configured yet. Click <b>Add provider</b>{' '}
              above to create the first one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {providersQuery.data.map((row) => (
              <ProviderCard
                key={row.id}
                row={row}
                testResult={testResults[row.id]}
                onTest={() => testMutation.mutate(row.id)}
                onActivate={() => activateMutation.mutate(row.id)}
                onEdit={() => openEdit(row)}
                onDelete={() => setConfirmDelete(row)}
                isTesting={
                  testMutation.isPending && testMutation.variables === row.id
                }
                isActivating={
                  activateMutation.isPending &&
                  activateMutation.variables === row.id
                }
              />
            ))}
          </div>
        )}
      </div>

      <ProviderEditorDialog
        open={editorOpen}
        onClose={closeEditor}
        editingId={editingId}
        draft={draft}
        setDraft={setDraft}
        onSubmit={submitDraft}
        submitting={createMutation.isPending || updateMutation.isPending}
        submitDisabled={submitDisabled}
        error={createMutation.error ?? updateMutation.error}
      />

      <DeleteConfirmDialog
        target={confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={(id) => deleteMutation.mutate(id)}
        pending={deleteMutation.isPending}
      />
    </div>
  );
}
