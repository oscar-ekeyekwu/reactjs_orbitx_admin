import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  UserX,
  UserCheck,
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';
import { usersApi, ordersApi } from '@/services/api';
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

export function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: driver, isLoading } = useQuery({
    queryKey: ['driver', id],
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['driver-orders', id],
    queryFn: () => ordersApi.getAll({ driverId: id, limit: 20 }),
    enabled: !!id,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (isActive: boolean) => usersApi.toggleActive(id!, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', id] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-6 text-center text-muted-foreground">Driver not found.</div>
    );
  }

  const orders = ordersData?.data || [];

  return (
    <div>
      <Header title="Driver Detail" subtitle={driver.name} />

      <div className="p-6 space-y-6">
        {/* Back */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Drivers
        </Button>

        {/* Profile header card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 text-xl">
                  {driver.avatar ? (
                    <AvatarImage src={driver.avatar} />
                  ) : (
                    <AvatarFallback>
                      {driver.first_name?.[0]}
                      {driver.last_name?.[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{driver.name}</h2>
                  <p className="text-sm text-muted-foreground font-mono mt-0.5">
                    {driver.id}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={driver.isActive ? 'success' : 'secondary'}>
                      {driver.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {driver.isEmailVerified && (
                      <Badge variant="info">Email Verified</Badge>
                    )}
                    {driver.isPhoneVerified && (
                      <Badge variant="info">Phone Verified</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => toggleActiveMutation.mutate(!driver.isActive)}
                disabled={toggleActiveMutation.isPending}
                className="gap-2"
              >
                {driver.isActive ? (
                  <>
                    <UserX className="h-4 w-4 text-red-500" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 text-green-500" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Contact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{driver.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{driver.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Joined {format(new Date(driver.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Verification */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email</span>
                {driver.isEmailVerified ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle className="h-4 w-4" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <XCircle className="h-4 w-4" /> Not verified
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phone</span>
                {driver.isPhoneVerified ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle className="h-4 w-4" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <XCircle className="h-4 w-4" /> Not verified
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                Delivery Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Assigned</span>
                <span className="font-semibold text-lg">
                  {ordersData?.meta?.total ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Delivered</span>
                <span className="font-medium text-green-600">
                  {orders.filter((o) => o.status === 'delivered').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cancelled</span>
                <span className="font-medium">
                  {orders.filter((o) => o.status === 'cancelled').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned orders */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Assigned Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : orders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No orders assigned
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <TableCell className="font-mono text-sm">
                        #{order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-[200px]">
                          {order.pickupAddress}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {order.deliveryAddress}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[order.status]}>
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₦{Number(order.estimatedPrice).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(order.createdAt), 'MMM d, yyyy')}
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
