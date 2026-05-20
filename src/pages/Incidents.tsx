import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertOctagon } from 'lucide-react';
import { format } from 'date-fns';
import { Header } from '@/components/layout';
import {
  Badge,
  Card,
  CardContent,
  Label,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import {
  incidentsApi,
  type IncidentStatus,
} from '@/services/api/incidents';

const STATUSES: IncidentStatus[] = ['open', 'acknowledged', 'closed'];

export function IncidentsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<IncidentStatus | ''>('');

  const { data, isLoading } = useQuery({
    queryKey: ['incidents', status],
    queryFn: () => incidentsApi.list(status || undefined),
    refetchInterval: 10000,
  });

  const rows = data ?? [];

  return (
    <div>
      <Header
        title="Incidents"
        subtitle="Driver SOS events. Acknowledge fast — time-to-ack is tracked against a 5-minute p95 target."
      />

      <div className="p-6 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="max-w-xs space-y-1">
              <Label htmlFor="incidents-status">Status</Label>
              <Select
                id="incidents-status"
                data-testid="incidents-filter-status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as IncidentStatus | '')
                }
              >
                <option value="">All</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : rows.length === 0 ? (
              <div
                data-testid="incidents-empty"
                className="py-12 text-center text-sm text-muted-foreground"
              >
                No incidents recorded yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Raised</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Outcome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-testid={`incidents-row-${row.id}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/incidents/${row.id}`)}
                    >
                      <TableCell className="whitespace-nowrap text-xs">
                        {format(new Date(row.raisedAt), 'PPp')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AlertOctagon className="h-4 w-4 text-red-500" />
                          <span className="font-mono text-xs">
                            {row.driverId.slice(0, 8)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.orderId.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <IncidentStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.outcome ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  const variant: 'default' | 'secondary' | 'destructive' =
    status === 'open'
      ? 'destructive'
      : status === 'acknowledged'
        ? 'default'
        : 'secondary';
  return <Badge variant={variant}>{status}</Badge>;
}
