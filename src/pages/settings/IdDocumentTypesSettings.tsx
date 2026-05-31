import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Save } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '@/components/ui';
import {
  DOCUMENT_TYPE_LABEL,
  type DocumentType,
} from '@/services/api/documents';
import { idTypesApi } from '@/services/api/idTypes';

// The candidate set the driver setup wizard supports for the ID step.
// Other DocumentType slugs aren't shown here — they're not "identity
// documents" in the v1 spec sense.
const ID_CANDIDATES: ReadonlyArray<DocumentType> = [
  'nin',
  'drivers_license',
  'passport',
  'voters_card',
];

export function IdDocumentTypesSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['allowed-id-types'],
    queryFn: idTypesApi.list,
  });

  // Seed the editable draft from server data, re-seeding whenever the
  // server value changes identity. Adjusting state during render (React's
  // documented pattern) avoids the cascading re-render an effect would
  // cause — https://react.dev/learn/you-might-not-need-an-effect
  const [draft, setDraft] = useState<DocumentType[]>([]);
  const [seededFrom, setSeededFrom] = useState<DocumentType[] | undefined>(
    undefined,
  );
  if (data?.allowed && data.allowed !== seededFrom) {
    setSeededFrom(data.allowed);
    setDraft(data.allowed);
  }

  const mutation = useMutation({
    mutationFn: (allowed: DocumentType[]) => idTypesApi.update(allowed),
    onSuccess: (resp) => {
      queryClient.setQueryData(['allowed-id-types'], resp);
    },
  });

  const dirty = useMemo(() => {
    const a = [...draft].sort();
    const b = [...(data?.allowed ?? [])].sort();
    return a.length !== b.length || a.some((v, i) => v !== b[i]);
  }, [draft, data?.allowed]);

  const toggle = (type: DocumentType) => {
    setDraft((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const validationError = draft.length === 0
    ? 'At least one ID type must be enabled or new drivers can’t complete setup.'
    : null;

  return (
    <div>
      <Header
        title="ID Document Types"
        subtitle="Which identity documents the driver setup wizard offers in the ID picker"
      />

      <div className="p-4 md:p-6">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: 'Settings', href: '/settings' },
            { label: 'ID Document Types' },
          ]}
        />

        <div className="max-w-2xl space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Allowed ID types
              </CardTitle>
              <CardDescription>
                The customer mobile fetches this list at the start of the ID
                step and only shows the entries you enable here. Changes take
                effect on the next time a driver opens the screen — no APK
                rebuild needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <div className="space-y-2">
                  {ID_CANDIDATES.map((type) => {
                    const checked = draft.includes(type);
                    return (
                      <label
                        key={type}
                        data-testid={`allowed-id-type-${type}`}
                        className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-white p-3 transition-colors hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(type)}
                          className="mt-1 h-4 w-4"
                        />
                        <div className="flex-1">
                          <p className="font-medium leading-tight">
                            {DOCUMENT_TYPE_LABEL[type]}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Slug:{' '}
                            <code className="rounded bg-muted px-1">{type}</code>
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {validationError && (
                <p
                  data-testid="allowed-id-types-validation"
                  className="mt-3 text-xs text-red-600"
                >
                  {validationError}
                </p>
              )}

              <div className="mt-4 flex items-center justify-end gap-3">
                {mutation.isError && (
                  <p className="text-sm text-red-500">
                    Could not save. Please try again.
                  </p>
                )}
                {mutation.isSuccess && !dirty && (
                  <p className="text-sm text-green-600">Saved</p>
                )}
                <Button
                  data-testid="allowed-id-types-save"
                  disabled={
                    !!validationError ||
                    !dirty ||
                    mutation.isPending ||
                    isLoading
                  }
                  onClick={() => mutation.mutate(draft)}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {mutation.isPending ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
