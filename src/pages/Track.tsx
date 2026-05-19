import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

/**
 * E3 — public read-only tracking page. No auth required; reachable as
 * `/track/:token` (the mobile share sheet hands this URL to the
 * recipient). Calls the backend's matching public endpoint and renders
 * the stripped snapshot — stages, ETA, and driver first name. No PII.
 */

interface PublicTrackingSnapshot {
  shortId: string;
  status:
    | 'pending'
    | 'accepted'
    | 'picked_up'
    | 'in_transit'
    | 'delivered'
    | 'cancelled';
  stages: {
    status:
      | 'pending'
      | 'accepted'
      | 'picked_up'
      | 'in_transit'
      | 'delivered';
    at: string | null;
  }[];
  driverFirstName: string | null;
  etaMinutes: number | null;
  expired: false;
}

const STAGE_LABELS: Record<PublicTrackingSnapshot['stages'][0]['status'], string> = {
  pending: 'Order placed',
  accepted: 'Driver accepted',
  picked_up: 'Package picked up',
  in_transit: 'On the way',
  delivered: 'Delivered',
};

const API_URL =
  window.__APP_CONFIG__?.API_URL || 'http://localhost:5050/api/v1';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ok'; snapshot: PublicTrackingSnapshot }
  | { kind: 'expired' }
  | { kind: 'not-found' }
  | { kind: 'error' };

export function TrackPage() {
  const { token } = useParams<{ token: string }>();
  // Derive the initial state from the token rather than calling setState
  // synchronously inside the effect — the latter trips react-hooks v5's
  // set-state-in-effect rule.
  const [state, setState] = useState<LoadState>(() =>
    token ? { kind: 'loading' } : { kind: 'not-found' },
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    // Plain axios (not the apiClient) so the auth interceptors don't fire —
    // this page is meant to be reachable by un-authenticated recipients.
    axios
      .get<PublicTrackingSnapshot>(`${API_URL}/track/${token}`)
      .then((res) => {
        if (!cancelled) setState({ kind: 'ok', snapshot: res.data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 410) {
            setState({ kind: 'expired' });
            return;
          }
          if (status === 404) {
            setState({ kind: 'not-found' });
            return;
          }
        }
        setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div
      data-testid="track-page-root"
      className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <header className="bg-slate-900 text-white px-6 py-4">
          <p className="text-xs uppercase tracking-wide text-slate-300">
            Orbit delivery
          </p>
          <h1 className="text-lg font-semibold">Live tracking</h1>
        </header>

        {state.kind === 'loading' && (
          <p
            data-testid="track-page-loading"
            className="px-6 py-12 text-center text-slate-500"
          >
            Loading…
          </p>
        )}

        {state.kind === 'expired' && (
          <p
            data-testid="track-page-expired"
            className="px-6 py-12 text-center text-slate-600"
          >
            This link has expired.
          </p>
        )}

        {state.kind === 'not-found' && (
          <p
            data-testid="track-page-not-found"
            className="px-6 py-12 text-center text-slate-600"
          >
            We could not find this delivery.
          </p>
        )}

        {state.kind === 'error' && (
          <p
            data-testid="track-page-error"
            className="px-6 py-12 text-center text-slate-600"
          >
            We could not reach the server. Please try again.
          </p>
        )}

        {state.kind === 'ok' && <Snapshot snapshot={state.snapshot} />}
      </div>
      <p className="text-xs text-slate-400 mt-4">
        This is a read-only link. Personal details are not shared.
      </p>
    </div>
  );
}

function Snapshot({ snapshot }: { snapshot: PublicTrackingSnapshot }) {
  const currentIdx = snapshot.stages.findIndex(
    (s) => s.status === snapshot.status,
  );

  return (
    <div className="px-6 py-6">
      <p
        data-testid="track-page-short-id"
        className="text-xs text-slate-500 uppercase tracking-wide"
      >
        Order #{snapshot.shortId}
      </p>

      {snapshot.status === 'cancelled' ? (
        <p
          data-testid="track-page-cancelled"
          className="mt-3 inline-flex px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium"
        >
          Cancelled
        </p>
      ) : (
        <>
          {snapshot.driverFirstName && (
            <p
              data-testid="track-page-driver"
              className="mt-2 text-slate-800 font-medium"
            >
              Driver: {snapshot.driverFirstName}
            </p>
          )}
          {snapshot.etaMinutes !== null && snapshot.status !== 'delivered' && (
            <p
              data-testid="track-page-eta"
              className="mt-1 text-slate-600 text-sm"
            >
              ETA · {snapshot.etaMinutes} min
              {snapshot.etaMinutes === 1 ? '' : 's'}
            </p>
          )}
        </>
      )}

      <ol className="mt-6 space-y-3">
        {snapshot.stages.map((stage, idx) => {
          const reached = currentIdx >= idx && snapshot.status !== 'cancelled';
          return (
            <li
              key={stage.status}
              data-testid={`track-page-stage-${stage.status}`}
              className="flex items-start gap-3"
            >
              <span
                className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                  reached ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              />
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    reached ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {STAGE_LABELS[stage.status]}
                </p>
                {reached && stage.at && (
                  <p className="text-xs text-slate-500">
                    {formatLagosTime(stage.at)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function formatLagosTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Africa/Lagos',
  });
}

export default TrackPage;
