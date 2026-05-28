import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import type { StorageMigrationDeletion } from '@/services/api';
import { DeletionBadge } from './parts';

type Props = {
  deletions: StorageMigrationDeletion[];
};

export function DeletionsCard({ deletions }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Source deletions</CardTitle>
        <CardDescription>
          Per-document outcome of the explicit source-delete action.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deletions.map((d) => (
              <TableRow
                key={d.id}
                data-testid={`storage-migration-deletion-${d.documentId}`}
              >
                <TableCell className="font-mono text-xs">
                  {d.documentId.slice(0, 8)}
                </TableCell>
                <TableCell>
                  <DeletionBadge status={d.status} />
                </TableCell>
                <TableCell className="text-xs">
                  {d.errorMessage ?? ''}
                </TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  {new Date(d.deletedAt).toLocaleString(undefined, {
                    hour12: true,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
