import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import { TrackPage } from './Track';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

function renderTrack(token: string) {
  return render(
    <MemoryRouter initialEntries={[`/track/${token}`]}>
      <Routes>
        <Route path="/track/:token" element={<TrackPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

const sampleSnapshot = {
  shortId: '66667777',
  status: 'in_transit',
  stages: [
    { status: 'pending', at: '2026-05-19T11:00:00.000Z' },
    { status: 'accepted', at: '2026-05-19T11:10:00.000Z' },
    { status: 'picked_up', at: '2026-05-19T11:30:00.000Z' },
    { status: 'in_transit', at: '2026-05-19T11:30:00.000Z' },
    { status: 'delivered', at: null },
  ],
  driverFirstName: 'Tunde',
  etaMinutes: 12,
  expired: false,
};

describe('TrackPage (E3)', () => {
  beforeEach(() => {
    mockedAxios.get = vi.fn() as never;
    mockedAxios.isAxiosError = vi.fn(
      (err: unknown) =>
        typeof err === 'object' && err !== null && 'response' in err,
    ) as never;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state while the snapshot is in flight', () => {
    mockedAxios.get = vi.fn(() => new Promise(() => {})) as never;
    renderTrack('abc');
    expect(screen.getByTestId('track-page-loading')).toBeTruthy();
  });

  it('renders the stripped snapshot — driver first name, ETA, stages', async () => {
    mockedAxios.get = vi
      .fn()
      .mockResolvedValue({ data: sampleSnapshot }) as never;
    renderTrack('abc');
    await waitFor(() =>
      expect(screen.queryByTestId('track-page-loading')).toBeNull(),
    );
    expect(screen.getByTestId('track-page-driver')).toHaveTextContent('Tunde');
    expect(screen.getByTestId('track-page-eta')).toHaveTextContent(/12 min/);
    expect(screen.getByTestId('track-page-stage-picked_up')).toBeTruthy();
    // No customer / recipient / phone strings anywhere on the page.
    expect(screen.queryByText(/recipient/i)).toBeNull();
    expect(screen.queryByText(/customer/i)).toBeNull();
  });

  it('shows the expired message on a 410 response', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue({
      response: { status: 410, data: {} },
    }) as never;
    renderTrack('abc');
    await waitFor(() =>
      expect(screen.getByTestId('track-page-expired')).toBeTruthy(),
    );
  });

  it('shows the not-found message on a 404 response', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue({
      response: { status: 404, data: {} },
    }) as never;
    renderTrack('abc');
    await waitFor(() =>
      expect(screen.getByTestId('track-page-not-found')).toBeTruthy(),
    );
  });

  it('shows the generic error on other failures', async () => {
    mockedAxios.get = vi
      .fn()
      .mockRejectedValue(new Error('network down')) as never;
    renderTrack('abc');
    await waitFor(() =>
      expect(screen.getByTestId('track-page-error')).toBeTruthy(),
    );
  });

  it('renders cancelled state with no ETA when status is cancelled', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: { ...sampleSnapshot, status: 'cancelled' },
    }) as never;
    renderTrack('abc');
    await waitFor(() =>
      expect(screen.getByTestId('track-page-cancelled')).toBeTruthy(),
    );
    expect(screen.queryByTestId('track-page-eta')).toBeNull();
  });
});
