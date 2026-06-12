import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  Package,
  MapPin,
  User,
  Clock,
  CheckCircle,
  Truck,
  Megaphone,
  Wallet,
  ImageIcon,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { Header } from '@/components/layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Breadcrumb,
  Spinner,
  Select,
  Button,
} from '@/components/ui';
import { ordersApi } from '@/services/api';
import type { OrderStatus } from '@/types';

const statusColors: Record<
  OrderStatus,
  'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'
> = {
  pending: 'warning',
  accepted: 'info',
  picked_up: 'info',
  in_transit: 'info',
  delivered: 'success',
  cancelled: 'destructive',
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersApi.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const [rebroadcastFeedback, setRebroadcastFeedback] = useState<
    { kind: 'ok' | 'err'; text: string } | null
  >(null);
  const [rebroadcastCooldown, setRebroadcastCooldown] = useState(0);

  useEffect(() => {
    if (rebroadcastCooldown <= 0) return;
    const t = setTimeout(
      () => setRebroadcastCooldown((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearTimeout(t);
  }, [rebroadcastCooldown]);

  const rebroadcastMutation = useMutation({
    mutationFn: () => ordersApi.rebroadcast(id!),
    onSuccess: () => {
      setRebroadcastFeedback({
        kind: 'ok',
        text: 'Re-notified eligible drivers.',
      });
      setRebroadcastCooldown(30);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      setRebroadcastFeedback({
        kind: 'err',
        text:
          e.response?.data?.message ??
          'Could not rebroadcast. Try again in a moment.',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center text-muted-foreground">Order not found.</div>
    );
  }

  const timelineEvents = [
    { label: 'Created', time: order.createdAt, icon: <Package className="h-4 w-4" /> },
    { label: 'Accepted', time: order.acceptedAt, icon: <CheckCircle className="h-4 w-4" /> },
    { label: 'Picked Up', time: order.pickedUpAt, icon: <Truck className="h-4 w-4" /> },
    { label: 'Delivered', time: order.deliveredAt, icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
  ].filter((e) => e.time);

  const isFinal = order.status === 'delivered' || order.status === 'cancelled';

  return (
    <div>
      <Header
        title="Order Detail"
        subtitle={`#${order.id.slice(0, 8).toUpperCase()}`}
      />

      <div className="p-4 space-y-6 md:p-6">
        <Breadcrumb
          items={[
            { label: 'Orders', href: '/orders' },
            { label: `#${order.id.slice(0, 8).toUpperCase()}` },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            {rebroadcastFeedback && (
              <span
                className={
                  rebroadcastFeedback.kind === 'ok'
                    ? 'text-xs text-green-600'
                    : 'text-xs text-destructive'
                }
              >
                {rebroadcastFeedback.text}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={statusColors[order.status]} className="px-3 py-1 text-sm">
              {order.status.replace(/_/g, ' ')}
            </Badge>
            {order.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => rebroadcastMutation.mutate()}
                disabled={
                  rebroadcastMutation.isPending || rebroadcastCooldown > 0
                }
                title="Re-fire the eligible-drivers fanout (push + socket) for this order"
              >
                <Megaphone className="h-4 w-4 mr-1.5" />
                {rebroadcastMutation.isPending
                  ? 'Notifying…'
                  : rebroadcastCooldown > 0
                    ? `Try again in ${rebroadcastCooldown}s`
                    : 'Rebroadcast'}
              </Button>
            )}
            {!isFinal && (
              <Select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    updateStatusMutation.mutate(e.target.value as OrderStatus);
                    e.target.value = '';
                  }
                }}
                className="w-full sm:w-44"
                disabled={updateStatusMutation.isPending}
              >
                <option value="">Update status…</option>
                <option value="accepted">Accepted</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Route */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Route
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <div className="w-px flex-1 bg-border my-1" />
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                        Pickup
                      </p>
                      <p className="text-sm font-medium">{order.pickupAddress}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                        Delivery
                      </p>
                      <p className="text-sm font-medium">{order.deliveryAddress}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Package */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Package Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Description</dt>
                    <dd className="font-medium mt-0.5">{order.packageDescription || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Size</dt>
                    <dd className="font-medium mt-0.5 capitalize">{order.packageSize || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Weight</dt>
                    <dd className="font-medium mt-0.5">
                      {order.packageWeight ? `${order.packageWeight} kg` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Delivery Notes</dt>
                    <dd className="font-medium mt-0.5">{order.deliveryNotes || '—'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Recipient */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Recipient
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium mt-0.5">{order.recipientName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="font-medium mt-0.5">{order.recipientPhone}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Timeline */}
            {timelineEvents.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {timelineEvents.map((event, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div className="text-muted-foreground shrink-0">{event.icon}</div>
                        <span className="w-24 shrink-0 text-muted-foreground">{event.label}</span>
                        <span className="font-medium">
                          {format(new Date(event.time!), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated</span>
                  <span className="font-medium">
                    ₦{Number(order.estimatedPrice).toLocaleString()}
                  </span>
                </div>
                {order.insuranceFee != null && Number(order.insuranceFee) > 0 && (
                  <div className="flex justify-between">
                    <span
                      className="text-muted-foreground"
                      title="Debited from the rider's wallet at settlement"
                    >
                      Rider insurance
                    </span>
                    <span className="font-medium">
                      ₦{Number(order.insuranceFee).toLocaleString()}
                    </span>
                  </div>
                )}
                {order.platformCharge != null &&
                  Number(order.platformCharge) > 0 && (
                    <div className="flex justify-between">
                      <span
                        className="text-muted-foreground"
                        title="Held from the driver's prepaid wallet on accept"
                      >
                        Driver charge (held)
                      </span>
                      <span className="font-medium">
                        ₦{Number(order.platformCharge).toLocaleString()}
                      </span>
                    </div>
                  )}
                <div className="flex justify-between border-t pt-3">
                  <span className="text-muted-foreground">Final</span>
                  <span className="font-semibold text-base">
                    {order.finalPrice
                      ? `₦${Number(order.finalPrice).toLocaleString()}`
                      : '—'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Phase 3 — Payment loop visibility. Renders the offline
                bank-transfer status, the two timestamps the customer
                and driver respectively trigger, and the customer's
                proof screenshot (when uploaded) as a clickable
                thumbnail for dispute resolution. */}
            <PaymentSection order={order} />

            {/* Customer */}
            {order.customer && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Customer</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    to={`/customers/${order.customerId}`}
                    className="flex items-center gap-3 rounded-lg p-2 -mx-2 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar>
                      {order.customer.avatar ? (
                        <AvatarImage src={order.customer.avatar} />
                      ) : (
                        <AvatarFallback>
                          {order.customer.first_name?.[0]}
                          {order.customer.last_name?.[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{order.customer.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.customer.email}
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Driver */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Driver</CardTitle>
              </CardHeader>
              <CardContent>
                {order.driver ? (
                  <Link
                    to={`/drivers/${order.driverId}`}
                    className="flex items-center gap-3 rounded-lg p-2 -mx-2 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar>
                      {order.driver.avatar ? (
                        <AvatarImage src={order.driver.avatar} />
                      ) : (
                        <AvatarFallback>
                          {order.driver.first_name?.[0]}
                          {order.driver.last_name?.[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{order.driver.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.driver.email}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">No driver assigned yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Phase 3 — surfaces the bank-transfer payment loop on the admin
 * order detail. Renders four pieces of state:
 *
 *   1. paymentMethod + paymentStatus pill
 *   2. customerMarkedPaidAt timestamp (when set)
 *   3. paymentConfirmedAt timestamp (when set)
 *   4. paymentProofUrl thumbnail (when uploaded) — click expands
 *      to a full-size overlay so dispute investigations don't
 *      need a separate storage console trip.
 *
 * Always renders so admins can see "no payment data yet" as easily
 * as a confirmed one — the absence itself is information when ops
 * are working a dispute.
 */
function PaymentSection({
  order,
}: {
  order: import('@/types').Order;
}) {
  const [proofOpen, setProofOpen] = useState(false);
  const proofUrl = order.paymentProofUrl ?? null;
  const status = order.paymentStatus ?? 'pending_cash';

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Status</span>
            <PaymentStatusBadge status={status} />
          </div>
          {order.paymentMethod && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span className="font-medium capitalize">
                {order.paymentMethod.replace(/_/g, ' ')}
              </span>
            </div>
          )}
          {order.customerMarkedPaidAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer marked paid</span>
              <span className="font-medium">
                {format(new Date(order.customerMarkedPaidAt), 'MMM d, h:mm a')}
              </span>
            </div>
          )}
          {order.paymentConfirmedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Driver confirmed receipt</span>
              <span className="font-medium">
                {format(new Date(order.paymentConfirmedAt), 'MMM d, h:mm a')}
              </span>
            </div>
          )}

          {/* Proof image — only renders when uploaded. Empty state
              "—" would clutter the card for the 99% of orders
              without a proof. */}
          {proofUrl && (
            <div className="border-t pt-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Transfer screenshot
              </p>
              <button
                type="button"
                onClick={() => setProofOpen(true)}
                className="flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity"
              >
                <img
                  src={proofUrl}
                  alt="Customer transfer proof"
                  className="h-16 w-16 object-cover rounded-md border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" />
                    View full size
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Uploaded by the customer at mark-paid time.
                  </p>
                </div>
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {proofOpen && proofUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setProofOpen(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setProofOpen(false);
            }}
            className="absolute top-4 right-4 text-white p-2"
            aria-label="Close preview"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={proofUrl}
            alt="Customer transfer proof"
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' =
    status === 'completed'
      ? 'success'
      : status === 'customer_marked_paid'
        ? 'warning'
        : status === 'pending_transfer'
          ? 'info'
          : status === 'failed'
            ? 'destructive'
            : 'secondary';
  return (
    <Badge variant={variant} className="capitalize">
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
