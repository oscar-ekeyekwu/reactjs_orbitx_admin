import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Header } from '@/components/layout';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  Spinner,
  Textarea,
} from '@/components/ui';
import {
  incidentsApi,
  type CloseIncidentDto,
  type IncidentOutcome,
} from '@/services/api/incidents';
import { IncidentStatusBadge } from './Incidents';

const OUTCOMES: { value: IncidentOutcome; label: string }[] = [
  { value: 'resolved', label: 'Resolved' },
  { value: 'escalated_frsc', label: 'Escalated to FRSC' },
  { value: 'referred_insurance', label: 'Referred to insurance' },
  { value: 'false_alarm', label: 'False alarm' },
];

export function IncidentDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [closeOpen, setCloseOpen] = useState(false);
  const [outcome, setOutcome] = useState<IncidentOutcome>('resolved');
  const [note, setNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => incidentsApi.findOne(id),
    enabled: !!id,
    refetchInterval: (q) => (q.state.data?.status === 'closed' ? false : 5000),
  });

  const ackMutation = useMutation({
    mutationFn: () => incidentsApi.acknowledge(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['incident', id] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: (dto: CloseIncidentDto) => incidentsApi.close(id, dto),
    onSuccess: () => {
      setCloseOpen(false);
      setNote('');
      void queryClient.invalidateQueries({ queryKey: ['incident', id] });
    },
  });

  const incident = data;
  const timeToAck =
    incident?.acknowledgedAt && incident?.raisedAt
      ? new Date(incident.acknowledgedAt).getTime() -
        new Date(incident.raisedAt).getTime()
      : null;

  return (
    <div>
      <Header
        title="Incident"
        subtitle={incident ? `Order ${incident.orderId.slice(0, 8)}` : 'Loading…'}
      />

      <div className="p-6 space-y-4">
        <Link
          to="/incidents"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Incidents
        </Link>

        {isLoading || !incident ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle
                      data-testid="incident-detail-title"
                      className="flex items-center gap-2"
                    >
                      <AlertOctagon className="h-5 w-5 text-red-500" />
                      Incident {incident.id.slice(0, 8)}
                      <IncidentStatusBadge status={incident.status} />
                    </CardTitle>
                    <CardDescription>
                      Driver {incident.driverId.slice(0, 8)} · raised{' '}
                      {format(new Date(incident.raisedAt), 'PPpp')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {incident.status === 'open' && (
                      <Button
                        data-testid="incident-acknowledge"
                        onClick={() => ackMutation.mutate()}
                        disabled={ackMutation.isPending}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Acknowledge
                      </Button>
                    )}
                    {incident.status !== 'closed' && (
                      <Button
                        variant="destructive"
                        data-testid="incident-open-close"
                        onClick={() => setCloseOpen(true)}
                      >
                        Close incident
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <Field
                  label="Coordinates"
                  value={
                    incident.latitude !== null && incident.longitude !== null
                      ? `${incident.latitude}, ${incident.longitude}`
                      : 'Unknown'
                  }
                />
                <Field
                  label="Acknowledged"
                  value={
                    incident.acknowledgedAt
                      ? format(new Date(incident.acknowledgedAt), 'PPp')
                      : 'Not yet'
                  }
                />
                <Field
                  label="Time to acknowledge"
                  value={
                    timeToAck !== null
                      ? `${Math.round(timeToAck / 1000)}s`
                      : '—'
                  }
                  accent={
                    timeToAck !== null && timeToAck > 5 * 60 * 1000
                      ? 'red'
                      : undefined
                  }
                />
                <Field
                  label="Closed"
                  value={
                    incident.closedAt
                      ? format(new Date(incident.closedAt), 'PPp')
                      : 'Open'
                  }
                />
                {incident.outcome ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Outcome</p>
                    <p className="font-medium">
                      <Badge variant="secondary">{incident.outcome}</Badge>
                    </p>
                    {incident.outcomeNote ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm">
                        {incident.outcomeNote}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent data-testid="incident-close-modal">
          <DialogHeader>
            <DialogTitle>Close incident</DialogTitle>
            <DialogDescription>
              Choose an outcome + add a short note. The driver`s order clears
              its incident banner once the LAST open incident is closed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="incident-outcome">Outcome</Label>
              <Select
                id="incident-outcome"
                data-testid="incident-outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as IncidentOutcome)}
              >
                {OUTCOMES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="incident-note">Note</Label>
              <Textarea
                id="incident-note"
                data-testid="incident-note"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              data-testid="incident-close-submit"
              onClick={() =>
                closeMutation.mutate({ outcome, outcomeNote: note })
              }
              disabled={note.trim().length === 0 || closeMutation.isPending}
            >
              Close incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'red';
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`font-medium ${accent === 'red' ? 'text-red-600' : ''}`}
      >
        {value}
      </p>
    </div>
  );
}
