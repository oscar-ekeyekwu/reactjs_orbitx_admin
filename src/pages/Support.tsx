import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Plus,
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
  Textarea,
  Label,
  Avatar,
  AvatarFallback,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui';
import { supportApi, usersApi } from '@/services/api';
import type { UpdateSupportTicketDto } from '@/services/api';
import type {
  SupportTicket,
  SupportTicketStatus,
  SupportTicketPriority,
  User as UserType,
} from '@/types';
import { useDebouncedValue } from '@/lib/use-debounced-value';

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
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const queryClient = useQueryClient();
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  // Reset to page 1 during render when the search query or status filter
  // changes — React 19 idiom (see notification settings for the same pattern).
  const [prevFilter, setPrevFilter] = useState({ debouncedSearch, statusFilter });
  if (
    prevFilter.debouncedSearch !== debouncedSearch ||
    prevFilter.statusFilter !== statusFilter
  ) {
    setPrevFilter({ debouncedSearch, statusFilter });
    setPage(1);
  }

  const { data, isLoading } = useQuery({
    queryKey: ['support-tickets', page, debouncedSearch, statusFilter],
    queryFn: () =>
      supportApi.getAll({
        page,
        limit: 10,
        status: (statusFilter || undefined) as SupportTicketStatus | undefined,
        search: debouncedSearch || undefined,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupportTicketDto }) =>
      supportApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setSelectedTicket(null);
    },
  });

  const tickets = data?.data || [];
  const meta = data?.meta;

  const handleStatusChange = (ticketId: string, status: SupportTicketStatus) => {
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
              <div className="flex-1" />
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Ticket
              </Button>
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
                    handleStatusChange(
                      selectedTicket.id,
                      e.target.value as SupportTicketStatus,
                    )
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

      <CreateTicketDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}

interface CreateTicketDialogProps {
  open: boolean;
  onClose: () => void;
}

function CreateTicketDialog({ open, onClose }: CreateTicketDialogProps) {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<SupportTicketPriority>('medium');
  const debouncedUserSearch = useDebouncedValue(userSearch.trim(), 300);

  // Reset all dialog fields during render when the dialog closes.
  // React 19 idiom: compare against previous open value rather than useEffect.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      setSelectedUser(null);
      setUserSearch('');
      setSubject('');
      setDescription('');
      setPriority('medium');
    }
  }

  const { data: userResults, isFetching: usersLoading } = useQuery({
    queryKey: ['users-search', debouncedUserSearch],
    queryFn: () =>
      usersApi.getAll({
        search: debouncedUserSearch || undefined,
        limit: 8,
      }),
    enabled: open && !selectedUser && debouncedUserSearch.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: supportApi.adminCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      onClose();
    },
  });

  const canSubmit =
    !!selectedUser && subject.trim().length >= 3 && description.trim().length >= 10;

  const handleSubmit = () => {
    if (!selectedUser || !canSubmit) return;
    createMutation.mutate({
      userId: selectedUser.id,
      subject: subject.trim(),
      description: description.trim(),
      priority,
    });
  };

  const subjectCount = subject.trim().length;
  const descriptionCount = description.trim().length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {open && (
        <DialogContent onClose={onClose} className="max-w-xl">
          <DialogHeader className="pr-8">
            <DialogTitle>New Support Ticket</DialogTitle>
            <p className="text-sm text-muted-foreground">
              File a ticket on behalf of a customer or driver.
            </p>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>User</Label>
              {selectedUser ? (
                <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs font-medium">
                      {userInitials(selectedUser)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{selectedUser.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {selectedUser.email} · {selectedUser.role}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search users by name or email"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9"
                      autoFocus
                    />
                  </div>
                  {debouncedUserSearch ? (
                    <div className="max-h-56 overflow-y-auto rounded-md border">
                      {usersLoading ? (
                        <div className="flex justify-center py-4">
                          <Spinner size="sm" />
                        </div>
                      ) : userResults?.data?.length ? (
                        userResults.data.map((u) => (
                          <button
                            type="button"
                            key={u.id}
                            onClick={() => setSelectedUser(u)}
                            className="flex w-full items-center gap-3 border-b px-3 py-2 text-left last:border-0 hover:bg-accent focus:bg-accent focus:outline-none"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs font-medium">
                                {userInitials(u)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {u.name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {u.email}
                              </p>
                            </div>
                            <Badge variant="secondary" className="ml-auto capitalize">
                              {u.role}
                            </Badge>
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                          No users match "{debouncedUserSearch}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Start typing to search.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="ticket-subject">Subject</Label>
                <span
                  className={`text-xs ${
                    subjectCount > 0 && subjectCount < 3
                      ? 'text-red-500'
                      : 'text-muted-foreground'
                  }`}
                >
                  {subjectCount}/200
                </span>
              </div>
              <Input
                id="ticket-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Short summary of the issue"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="ticket-description">Description</Label>
                <span
                  className={`text-xs ${
                    descriptionCount > 0 && descriptionCount < 10
                      ? 'text-red-500'
                      : 'text-muted-foreground'
                  }`}
                >
                  {descriptionCount}/2000
                </span>
              </div>
              <Textarea
                id="ticket-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? Include any relevant order or driver IDs."
                rows={6}
                maxLength={2000}
                className="resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-priority">Priority</Label>
              <Select
                id="ticket-priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as SupportTicketPriority)
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>

            {createMutation.isError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                Failed to create ticket. Please try again.
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

function userInitials(u: UserType): string {
  const f = u.first_name?.[0] ?? '';
  const l = u.last_name?.[0] ?? '';
  return (f + l).toUpperCase() || u.email?.[0]?.toUpperCase() || '?';
}
