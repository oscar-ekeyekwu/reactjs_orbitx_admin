import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { Megaphone, Package } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Badge,
  Card,
  CardContent,
  EmptyState,
  Spinner,
} from '@/components/ui';
import { orderRequestsApi, type OpenRequestRow } from '@/services/api';

/**
 * Phase 2 dispatcher snapshot — every OrderRequest currently in
 * `open` status. Polled every 10s; backend resolves pending-offer
 * counts via a LATERAL join so the round-trip stays cheap.
 *
 * No map yet (intentional v1 cut). Each row shows pickup → delivery,
 * the quoted price, package size, distance, pending-offer count, and
 * a live countdown to expiry so dispatchers can spot stale requests.
 */
export function LiveRequestsPage() {
  const [now, setNow] = useState(() => Date.now());

  // Tick once a second so the per-row "expires in" timer updates
  // without re-querying. Cheap; no allocations beyond setState.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const requestsQuery = useQuery({
    queryKey: ['orderRequests', 'admin', 'open'],
    queryFn: () => orderRequestsApi.listOpen(),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });

  const rows = requestsQuery.data ?? [];

  const stats = useMemo(() => {
    const total = rows.length;
    const withOffers = rows.filter((r) => r.pendingOfferCount > 0).length;
    const aging = rows.filter((r) => {
      const ms = new Date(r.expiresAt).getTime() - now;
      return ms <= 60_000 && ms > 0;
    }).length;
    return { total, withOffers, aging };
  }, [rows, now]);

  return (
    <div>
      <Header
        title="Live Requests"
        subtitle="Customer dispatch requests awaiting a driver"
      />

      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Open" value={stats.total} />
          <StatTile label="With offers" value={stats.withOffers} />
          <StatTile label="Expiring < 1 min" value={stats.aging} />
        </div>

        {requestsQuery.isLoading ? (
          <div className="flex justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No open requests"
            description="When a customer taps Find driver, their request shows up here until a driver wins it or it expires."
          />
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <RequestRow key={r.id} row={r} now={now} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function RequestRow({ row, now }: { row: OpenRequestRow; now: number }) {
  const expiresMs = new Date(row.expiresAt).getTime() - now;
  const expiresSec = Math.max(0, Math.floor(expiresMs / 1000));
  const isExpiring = expiresSec > 0 && expiresSec <= 60;

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium truncate">
                {row.customerName ?? 'Customer'}
              </p>
              <Badge variant="secondary" className="capitalize">
                {row.packageSize}
              </Badge>
              {row.pendingOfferCount > 0 ? (
                <Badge variant="info">
                  {row.pendingOfferCount} offer
                  {row.pendingOfferCount === 1 ? '' : 's'}
                </Badge>
              ) : (
                <Badge variant="warning">No offers yet</Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>
                <Package className="inline h-3 w-3 mr-1" />
                {row.pickupAddress} → {row.deliveryAddress}
              </p>
              <p>
                ₦{Number(row.quotedPrice).toLocaleString()}
                {row.distanceKm != null
                  ? ` · ${Number(row.distanceKm).toFixed(1)} km`
                  : ''}
                {' · created '}
                {formatDistanceToNowStrict(new Date(row.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
          <div
            className={`text-right text-sm font-medium ${
              isExpiring
                ? 'text-destructive'
                : expiresSec === 0
                  ? 'text-muted-foreground'
                  : 'text-foreground'
            }`}
          >
            {expiresSec === 0
              ? 'expired'
              : `${Math.floor(expiresSec / 60)}:${String(expiresSec % 60).padStart(2, '0')}`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
