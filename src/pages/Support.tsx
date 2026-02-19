import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { Header } from '@/components/layout';
import {
  Card,
  CardContent,
  Input,
  Button,
  Badge,
  Spinner,
  Select,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui';
import { supportApi } from '@/services/api';
import type { SupportTicket, SupportTicketStatus, SupportTicketPriority } from '@/types';

const statusColors: Record<SupportTicketStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'secondary',
};

const priorityColors: Record<SupportTicketPriority, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  low: 'secondary',
  medium: 'default',
  high: 'warning',
  urgent: 'destructive',
};

export function SupportPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['support-tickets', page, search, statusFilter],
    queryFn: () =>
      supportApi.getAll({
        page,
        limit: 10,
        status: statusFilter || undefined,
      }),
    placeholderData: {
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string; priority?: string } }) =>
      supportApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setSelectedTicket(null);
    },
  });

  const tickets = data?.data || [];
  const meta = data?.meta;

  const handleStatusChange = (ticketId: string, status: string) => {
    updateMutation.mutate({ id: ticketId, data: { status } });
  };

  return (
    <div>
      <Header title="Support" subtitle="Manage customer support tickets" />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search tickets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-yellow-100 p-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tickets.filter((t) => t.status === 'open').length}
                </p>
                <p className="text-sm text-muted-foreground">Open</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tickets.filter((t) => t.status === 'in_progress').length}
                </p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tickets.filter((t) => t.status === 'resolved').length}
                </p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-gray-100 p-2">
                <MessageSquare className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{meta?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No support tickets found
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{ticket.subject}</h3>
                        <Badge variant={statusColors[ticket.status]}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant={priorityColors[ticket.priority]}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ticket.user?.name || 'Unknown User'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(ticket.createdAt), 'MMM d, HH:mm')}
                        </div>
                        {ticket.orderId && (
                          <div>Order: #{ticket.orderId.slice(0, 8)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(meta.page - 1) * meta.limit + 1} to{' '}
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
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        {selectedTicket && (
          <DialogContent onClose={() => setSelectedTicket(null)}>
            <DialogHeader>
              <DialogTitle>{selectedTicket.subject}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant={statusColors[selectedTicket.status]}>
                  {selectedTicket.status.replace('_', ' ')}
                </Badge>
                <Badge variant={priorityColors[selectedTicket.priority]}>
                  {selectedTicket.priority}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="mt-1">{selectedTicket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">User</p>
                  <p>{selectedTicket.user?.name || 'Unknown'}</p>
                  <p className="text-muted-foreground">{selectedTicket.user?.email}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Created</p>
                  <p>{format(new Date(selectedTicket.createdAt), 'MMM d, yyyy HH:mm')}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Update Status
                </p>
                <Select
                  value={selectedTicket.status}
                  onChange={(e) =>
                    handleStatusChange(selectedTicket.id, e.target.value)
                  }
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
