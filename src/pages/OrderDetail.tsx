import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  Clock,
  CheckCircle,
  Truck,
} from 'lucide-react';
import { format } from 'date-fns';
import { Header } from '@/components/layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Spinner,
  Select,
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
  const navigate = useNavigate();
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

      <div className="p-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
          <div className="flex items-center gap-3">
            <Badge variant={statusColors[order.status]} className="px-3 py-1 text-sm">
              {order.status.replace(/_/g, ' ')}
            </Badge>
            {!isFinal && (
              <Select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    updateStatusMutation.mutate(e.target.value as OrderStatus);
                    e.target.value = '';
                  }
                }}
                className="w-44"
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
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
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
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
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
                          {format(new Date(event.time!), 'MMM d, yyyy HH:mm')}
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
