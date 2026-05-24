import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
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
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { adminDocumentsApi } from '@/services/api/documents';
import { auditLogApi } from '@/services/api/audit-log';
import { ExpiryPill } from './Documents';

export function DocumentDetailPage() {
  const { id = '' } = useParams<{ id: string }>();

  const docQuery = useQuery({
    queryKey: ['admin-document', id],
    queryFn: () => adminDocumentsApi.findOne(id),
    enabled: !!id,
  });
  const auditQuery = useQuery({
    queryKey: ['admin-document-audit', id],
    queryFn: () => auditLogApi.findByTarget('document', id),
    enabled: !!id,
  });

  const doc = docQuery.data;

  const openSignedView = async () => {
    const { viewUrl } = await adminDocumentsApi.viewUrl(id);
    window.open(viewUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      <Header
        title={doc ? doc.type.replace(/_/g, ' ') : 'Document'}
        subtitle={
          doc
            ? `${doc.ownerType} · ${doc.ownerId.slice(0, 8)}`
            : 'Loading…'
        }
      />

      <div className="p-4 space-y-4 md:p-6">
        <Breadcrumb
          items={[
            { label: 'Documents', href: '/documents' },
            { label: doc ? doc.type : 'Document' },
          ]}
        />

        {docQuery.isLoading || !doc ? (
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
                      data-testid="document-detail-title"
                      className="flex items-center gap-2"
                    >
                      {doc.type.replace(/_/g, ' ')}
                      <Badge variant="secondary">{doc.status}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Uploaded {format(new Date(doc.createdAt), 'PPpp')}
                    </CardDescription>
                  </div>
                  {doc.fileKey ? (
                    <Button
                      data-testid="document-view-signed"
                      onClick={() => void openSignedView()}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open signed URL
                    </Button>
                  ) : (
                    <Badge variant="secondary">No stored file</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <Field
                  label="Owner"
                  value={`${doc.ownerType} · ${doc.ownerId.slice(0, 8)}`}
                />
                <Field
                  label="Expiry"
                  value={
                    doc.expiryDate
                      ? format(new Date(doc.expiryDate), 'PPP')
                      : 'No expiry'
                  }
                />
                <div>
                  <p className="text-xs text-muted-foreground">Traffic light</p>
                  <ExpiryPill expiryDate={doc.expiryDate} />
                </div>
                <Field
                  label="Reviewed"
                  value={
                    doc.reviewedAt
                      ? format(new Date(doc.reviewedAt), 'PPp')
                      : 'Not reviewed'
                  }
                />
                {doc.rejectionReason ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">
                      Rejection reason
                    </p>
                    <p className="font-medium">{doc.rejectionReason}</p>
                  </div>
                ) : null}
                {doc.fileKey ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Object key</p>
                    <p className="break-all font-mono text-xs">{doc.fileKey}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Approval history</CardTitle>
                <CardDescription>
                  Every admin decision touching this document.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {auditQuery.isLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner size="sm" />
                  </div>
                ) : (auditQuery.data ?? []).length === 0 ? (
                  <p
                    data-testid="document-audit-empty"
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
                          data-testid={`document-audit-row-${row.id}`}
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
