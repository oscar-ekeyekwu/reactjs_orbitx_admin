import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Car, Search } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
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
  adminVehiclesApi,
  type VehicleStatus,
} from '@/services/api/vehicles';

const STATUSES: VehicleStatus[] = [
  'draft',
  'pending_approval',
  'approved',
  'active',
  'rejected',
  'suspended',
  'retired',
];
const PAGE_SIZE = 25;

export function VehiclesPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<VehicleStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      ...(status ? { status } : {}),
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    [status, page],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vehicles', params],
    queryFn: () => adminVehiclesApi.list(params),
  });

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(
      (v) =>
        v.plate.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q) ||
        (v.ownerName ?? '').toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <div>
      <Header
        title="Vehicles"
        subtitle="Every registered vehicle, scoped by status."
      />

      <div className="p-6 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="vehicle-search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="vehicle-search"
                    data-testid="vehicles-search"
                    className="pl-9"
                    placeholder="Plate, type, or owner"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="vehicle-status">Status</Label>
                <Select
                  id="vehicle-status"
                  data-testid="vehicles-filter-status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as VehicleStatus | '');
                    setPage(1);
                  }}
                >
                  <option value="">All</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : filtered.length === 0 ? (
              <div
                data-testid="vehicles-empty"
                className="py-12 text-center text-sm text-muted-foreground"
              >
                No vehicles match the current filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plate</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v) => (
                    <TableRow
                      key={v.id}
                      data-testid={`vehicles-row-${v.id}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/vehicles/${v.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono font-medium">
                            {v.plate}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{v.type}</TableCell>
                      <TableCell className="text-xs">
                        {v.color ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {v.ownerName ??
                          `${v.owner.type}:${v.owner.id.slice(0, 8)}`}
                      </TableCell>
                      <TableCell className="text-xs">
                        {v.assignedDriverName ??
                          (v.assignedDriverId ? v.assignedDriverId.slice(0, 8) : '—')}
                      </TableCell>
                      <TableCell>
                        <VehicleStatusBadge status={v.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          {(data?.total ?? 0) > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Page {page} · {data?.total} total
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page * PAGE_SIZE >= (data?.total ?? 0)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const variant: 'default' | 'secondary' | 'destructive' =
    status === 'approved' || status === 'active'
      ? 'default'
      : status === 'rejected' || status === 'suspended'
        ? 'destructive'
        : 'secondary';
  return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>;
}

