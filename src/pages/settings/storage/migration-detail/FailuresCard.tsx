import {
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
import type { StorageMigrationFailureRow } from '@/services/api';

type Props = {
  failures: StorageMigrationFailureRow[];
  isLoading: boolean;
};

export function FailuresCard({ failures, isLoading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Failures</CardTitle>
        <CardDescription>
          Per-document errors after exhausting the 3-attempt retry budget (1s /
          4s / 16s backoff).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Spinner size="sm" />
        ) : failures.length === 0 ? (
          <p
            data-testid="storage-migration-failures-empty"
            className="text-sm text-muted-foreground"
          >
            No failures recorded.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead className="text-right">Attempt</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Recorded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {failures.map((f) => (
                <TableRow
                  key={f.id}
                  data-testid={`storage-migration-failure-${f.documentId}`}
                >
                  <TableCell className="font-mono text-xs">
                    {f.documentId.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {f.attempt}
                  </TableCell>
                  <TableCell className="text-xs">{f.errorMessage}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(f.createdAt).toLocaleString(undefined, {
                      hour12: true,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
