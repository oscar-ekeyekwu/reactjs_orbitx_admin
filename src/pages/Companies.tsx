import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Search } from 'lucide-react';
import { format } from 'date-fns';
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
  adminCompaniesApi,
  type CompanyStatus,
} from '@/services/api/companies';

const STATUSES: CompanyStatus[] = ['pending', 'approved', 'suspended'];
const PAGE_SIZE = 25;

export function CompaniesPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<CompanyStatus | ''>('');
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
    queryKey: ['admin-companies', params],
    queryFn: () => adminCompaniesApi.list(params),
  });

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(
      (c) =>
        c.legalName.toLowerCase().includes(q) ||
        (c.cacNumber ?? '').toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <div>
      <Header title="Companies" subtitle="Every registered fleet operator." />

      <div className="p-6 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="company-search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="company-search"
                    data-testid="companies-search"
                    className="pl-9"
                    placeholder="Legal name or CAC number"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="company-status">Status</Label>
                <Select
                  id="company-status"
                  data-testid="companies-filter-status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as CompanyStatus | '');
                    setPage(1);
                  }}
                >
                  <option value="">All</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
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
                data-testid="companies-empty"
                className="py-12 text-center text-sm text-muted-foreground"
              >
                No companies match the current filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Legal name</TableHead>
                    <TableHead>CAC</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Vehicles</TableHead>
                    <TableHead className="text-right">Drivers</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      data-testid={`companies-row-${c.id}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/companies/${c.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{c.legalName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {c.cacNumber ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {c.createdByUser?.email ?? c.createdBy.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <CompanyStatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {c.vehicleCount ?? '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {c.driverCount ?? '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {format(new Date(c.createdAt), 'MMM d, yyyy')}
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

export function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  const variant: 'default' | 'secondary' | 'destructive' =
    status === 'approved'
      ? 'default'
      : status === 'suspended'
        ? 'destructive'
        : 'secondary';
  return <Badge variant={variant}>{status}</Badge>;
}
