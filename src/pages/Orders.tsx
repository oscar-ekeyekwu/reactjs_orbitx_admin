import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Package, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { Header } from "@/components/layout";
import {
  Card,
  CardContent,
  Input,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  EmptyState,
  TableSkeleton,
  Select,
} from "@/components/ui";
import { ordersApi } from "@/services/api";
import type { OrderStatus } from "@/types";

const statusColors: Record<
  OrderStatus,
  "default" | "secondary" | "success" | "warning" | "destructive" | "info"
> = {
  pending: "warning",
  accepted: "info",
  picked_up: "info",
  in_transit: "info",
  delivered: "success",
  cancelled: "destructive",
};

export function OrdersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchParams, setSearchParams] = useSearchParams();
  // Cross-link entry: `/orders?driverId=<uuid>` from DriverDetail.
  const driverIdFilter = searchParams.get("driverId") ?? "";
  const clearDriverFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("driverId");
    setSearchParams(next, { replace: true });
  };
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["orders", page, search, statusFilter, driverIdFilter],
    queryFn: () =>
      ordersApi.getAll({
        page,
        limit: 10,
        status: statusFilter as OrderStatus | undefined,
        ...(driverIdFilter ? { driverId: driverIdFilter } : {}),
      }),
  });

  const orders = data?.data || [];
  const meta = data?.meta;

  return (
    <div>
      <Header title="Orders" subtitle="View and manage all orders" />

      <div className="p-6 space-y-6">
        {driverIdFilter ? (
          <div
            data-testid="orders-driver-filter-chip"
            className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
          >
            <span className="text-muted-foreground">Filtered by driver:</span>
            <code className="font-mono text-xs">
              {driverIdFilter.slice(0, 8)}
            </code>
            <button
              type="button"
              data-testid="orders-driver-filter-clear"
              onClick={clearDriverFilter}
              className="ml-auto text-xs underline text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        ) : null}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="relative w-full sm:max-w-sm sm:flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by order ID or recipient..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-40"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4">
                <TableSkeleton rows={6} columns={5} />
              </div>
            ) : orders.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={Package}
                  title="No orders found"
                  description={
                    search || statusFilter || driverIdFilter
                      ? 'No orders match the current filters. Try clearing them or widening the date range.'
                      : 'Orders placed by customers in the mobile app will appear here as they come in.'
                  }
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">
                            #{order.id.slice(0, 8)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-green-500" />
                            <span className="truncate max-w-[200px]">
                              {order.pickupAddress}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-red-500" />
                            <span className="truncate max-w-[200px]">
                              {order.deliveryAddress}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.recipientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.recipientPhone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[order.status]}>
                          {order.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          ₦{order.finalPrice || order.estimatedPrice}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(order.createdAt), "MMM d, HH:mm")}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {(meta.page - 1) * meta.limit + 1} to{" "}
                {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!meta.hasPreviousPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!meta.hasNextPage}
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
