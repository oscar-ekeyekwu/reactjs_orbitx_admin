import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download, Trash2, Undo2 } from 'lucide-react';
import { Header } from '@/components/layout';
import {
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
} from '@/components/ui';
import { meApi } from '@/services/api/me';

export function PrivacySettingsPage() {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(
    null,
  );

  const exportMutation = useMutation({
    mutationFn: () => meApi.export(),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `orbit-data-export-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => meApi.requestDelete(),
    onSuccess: (data) => {
      setDeletionScheduledAt(data.deletionScheduledAt);
      setDeleteConfirmOpen(false);
    },
  });

  const cancelDeleteMutation = useMutation({
    mutationFn: () => meApi.cancelDelete(),
    onSuccess: (data) => {
      setDeletionScheduledAt(data.deletionScheduledAt);
    },
  });

  return (
    <div>
      <Header
        title="Privacy"
        subtitle="Export your data, delete your account, or review our privacy policy."
      />

      <div className="p-6 space-y-4">
        <Breadcrumb
          items={[
            { label: 'Settings', href: '/settings' },
            { label: 'Privacy' },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Export my data</CardTitle>
            <CardDescription>
              NDPA §31 — download a JSON snapshot of your account: profile,
              orders, documents metadata, wallet transactions. Document file
              contents are not included.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              data-testid="privacy-export"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {exportMutation.isPending ? 'Preparing…' : 'Download export'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delete my account</CardTitle>
            <CardDescription>
              NDPA §34 — request account deletion. Your row enters a 30-day
              grace window, during which you can cancel. After the window,
              identifiers (email, phone, name) are pseudonymised; order
              history is retained in anonymised form (DR-N3).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {deletionScheduledAt ? (
              <div
                data-testid="privacy-deletion-pending"
                className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800"
              >
                <p>
                  Deletion scheduled at{' '}
                  <strong>
                    {new Date(deletionScheduledAt).toLocaleString()}
                  </strong>
                  . You can cancel within 30 days.
                </p>
                <Button
                  variant="outline"
                  data-testid="privacy-cancel-delete"
                  onClick={() => cancelDeleteMutation.mutate()}
                  disabled={cancelDeleteMutation.isPending}
                  className="gap-2"
                >
                  <Undo2 className="h-4 w-4" />
                  {cancelDeleteMutation.isPending
                    ? 'Cancelling…'
                    : 'Cancel deletion'}
                </Button>
              </div>
            ) : (
              <Button
                variant="destructive"
                data-testid="privacy-delete"
                onClick={() => setDeleteConfirmOpen(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete my account
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
      >
        <DialogContent data-testid="privacy-delete-confirm">
          <DialogHeader>
            <DialogTitle>Request account deletion?</DialogTitle>
            <DialogDescription>
              Your account will be marked for deletion. You have 30 days to
              cancel from the Privacy page before the row is anonymised.
              Past orders stay in our records but are stripped of personally
              identifying fields.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              data-testid="privacy-delete-confirm-submit"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? 'Scheduling…'
                : 'Yes, schedule deletion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
