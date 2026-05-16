import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Truck,
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Spinner, Badge } from '@/components/ui';
import { dashboardApi, ordersApi, usersApi } from '@/services/api';
import type { Trend } from '@/types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: Trend;
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  const trendColor =
    trend?.direction === 'up'
      ? 'text-green-600'
      : trend?.direction === 'down'
        ? 'text-red-600'
        : 'text-muted-foreground';
  const trendArrow =
    trend?.direction === 'up' ? '↑' : trend?.direction === 'down' ? '↓' : '→';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            {trend && (
              <p className={`mt-1 text-xs ${trendColor}`}>
                {trendArrow} {trend.deltaPercent}% from last week
              </p>
            )}
          </div>
          <div className="rounded-full bg-primary/10 p-3">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: timeseries, isLoading: timeseriesLoading } = useQuery({
    queryKey: ['dashboard-timeseries'],
    queryFn: dashboardApi.getTimeseries,
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => ordersApi.getAll({ limit: 5 }),
  });

  const { data: newDrivers, isLoading: driversLoading } = useQuery({
    queryKey: ['new-drivers'],
    queryFn: () => usersApi.getDrivers({ limit: 5 }),
  });

  if (statsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Overview of your dispatch platform"
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Customers"
            value={stats?.totalCustomers?.toLocaleString() || '0'}
            icon={<Users className="h-5 w-5 text-primary" />}
            trend={stats?.trends?.customers}
          />
          <StatCard
            title="Active Drivers"
            value={stats?.totalDrivers?.toLocaleString() || '0'}
            icon={<Truck className="h-5 w-5 text-primary" />}
            trend={stats?.trends?.drivers}
          />
          <StatCard
            title="Total Orders"
            value={stats?.totalOrders?.toLocaleString() || '0'}
            icon={<Package className="h-5 w-5 text-primary" />}
            trend={stats?.trends?.orders}
          />
          <StatCard
            title="Total Revenue"
            value={`₦${stats?.totalRevenue?.toLocaleString() || '0'}`}
            icon={<DollarSign className="h-5 w-5 text-primary" />}
            trend={stats?.trends?.revenue}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeseriesLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <Spinner />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeseries?.revenue ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `₦${Number(value ?? 0).toLocaleString()}`,
                        'Revenue',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#61F62A"
                      fill="#61F62A"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Orders Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Weekly Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeseriesLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <Spinner />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeseries?.orders ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(value) => [Number(value ?? 0), 'Orders']}
                    />
                    <Bar dataKey="value" fill="#61F62A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-yellow-100 p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold">{stats?.pendingOrders || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Orders Today</p>
                <p className="text-2xl font-bold">{stats?.todayOrders || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-primary/10 p-3">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold">
                  ₦{stats?.todayRevenue?.toLocaleString() || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : recentOrders?.data?.length ? (
                <div className="space-y-4">
                  {recentOrders.data.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-medium">#{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.recipientName}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            order.status === 'delivered'
                              ? 'success'
                              : order.status === 'cancelled'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {order.status}
                        </Badge>
                        <p className="mt-1 text-sm font-medium">
                          ₦{order.estimatedPrice}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No recent orders
                </p>
              )}
            </CardContent>
          </Card>

          {/* New Drivers */}
          <Card>
            <CardHeader>
              <CardTitle>New Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              {driversLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : newDrivers?.data?.length ? (
                <div className="space-y-4">
                  {newDrivers.data.map((driver) => (
                    <div
                      key={driver.id}
                      className="flex items-center gap-3 border-b pb-3 last:border-0"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-medium">
                        {driver.first_name?.[0]}
                        {driver.last_name?.[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {driver.email}
                        </p>
                      </div>
                      <Badge variant={driver.isActive ? 'success' : 'secondary'}>
                        {driver.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No new drivers
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
