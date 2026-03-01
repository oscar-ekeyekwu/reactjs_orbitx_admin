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

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['customer-orders', id],
    queryFn: () => ordersApi.getAll({ customerId: id, limit: 20 }),
    enabled: !!id,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (isActive: boolean) => usersApi.toggleActive(id!, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 text-center text-muted-foreground">Customer not found.</div>
    );
  }

  const orders = ordersData?.data || [];

  return (
    <div>
      <Header title="Customer Detail" subtitle={customer.name} />

      <div className="p-6 space-y-6">
        {/* Back */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Button>

        {/* Profile header card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 text-xl">
                  {customer.avatar ? (
                    <AvatarImage src={customer.avatar} />
                  ) : (
                    <AvatarFallback>
                      {customer.first_name?.[0]}
                      {customer.last_name?.[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{customer.name}</h2>
                  <p className="text-sm text-muted-foreground font-mono mt-0.5">
                    {customer.id}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={customer.isActive ? 'success' : 'secondary'}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {customer.isEmailVerified && (
                      <Badge variant="info">Email Verified</Badge>
                    )}
                    {customer.isPhoneVerified && (
                      <Badge variant="info">Phone Verified</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => toggleActiveMutation.mutate(!customer.isActive)}
                disabled={toggleActiveMutation.isPending}
                className="gap-2"
              >
                {customer.isActive ? (
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
                <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{customer.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Joined {format(new Date(customer.createdAt), 'MMM d, yyyy')}</span>
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
                {customer.isEmailVerified ? (
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
                {customer.isPhoneVerified ? (
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

          {/* Order summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Orders</span>
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

        {/* Orders table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : orders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No orders yet
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
