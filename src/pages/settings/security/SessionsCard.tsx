import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Monitor, Smartphone, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '@/components/ui';
import { authApi } from '@/services/api';
import { summarizeUserAgent } from './utils';

export function SessionsCard() {
  const queryClient = useQueryClient();
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: authApi.listSessions,
  });

  const revokeMutation = useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Active sessions
        </CardTitle>
        <CardDescription>
          Devices currently signed in to your account. Revoking a session forces
          that device to sign in again.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !sessions?.length ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No active sessions
          </p>
        ) : (
          <ul className="space-y-3">
            {sessions.map((session) => {
              const isMobile = /mobile|android|iphone/i.test(
                session.userAgent ?? '',
              );
              const Icon = isMobile ? Smartphone : Monitor;
              return (
                <li
                  key={session.id}
                  className="flex items-start gap-3 rounded-md border p-3"
                >
                  <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {summarizeUserAgent(session.userAgent)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.ipAddress ?? 'Unknown IP'} · Signed in{' '}
                      {format(
                        new Date(session.createdAt),
                        'MMM d, yyyy h:mm a',
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => revokeMutation.mutate(session.id)}
                    disabled={revokeMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Revoke</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
