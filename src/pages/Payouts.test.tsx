import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { listMock, markPaidMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  markPaidMock: vi.fn(),
}));

vi.mock('@/services/api', async () => {
  const actual = await vi.importActual<typeof import('@/services/api')>(
    '@/services/api',
  );
  return {
    ...actual,
    payoutsApi: {
      listManual: listMock,
      markPaid: markPaidMock,
    },
  };
});

import { PayoutsPage } from './Payouts';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PayoutsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PayoutsPage (G4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    markPaidMock.mockResolvedValue({});
  });

  it('empty-state when no manual payouts pending', async () => {
    listMock.mockResolvedValueOnce({ items: [], total: 0 });
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId('payouts-empty')).toBeInTheDocument(),
    );
  });

  it('renders one row per pending payout with amount + recipient', async () => {
    listMock.mockResolvedValueOnce({
      items: [
        {
          id: 'payout-1',
          recipientUserId: 'driver-1',
          recipient: { id: 'driver-1', first_name: 'Tunde', last_name: 'A' },
          amount: 5000,
          status: 'pending_manual',
          periodStart: '2026-05-12T00:00:00.000Z',
          periodEnd: '2026-05-18T22:59:59.999Z',
          createdAt: '2026-05-19T00:00:00.000Z',
        },
      ],
      total: 1,
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId('payout-row-payout-1')).toBeInTheDocument(),
    );
    expect(screen.getByText(/Tunde A/)).toBeInTheDocument();
    expect(screen.getByText(/5,000/)).toBeInTheDocument();
  });

  it('mark-paid disabled until a reference is typed', async () => {
    listMock.mockResolvedValueOnce({
      items: [
        {
          id: 'payout-1',
          recipientUserId: 'driver-1',
          recipient: { id: 'driver-1', first_name: 'T' },
          amount: 1000,
          status: 'pending_manual',
          periodStart: '2026-05-12T00:00:00.000Z',
          periodEnd: '2026-05-18T22:59:59.999Z',
          createdAt: '2026-05-19T00:00:00.000Z',
        },
      ],
      total: 1,
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId('payout-row-payout-1')).toBeInTheDocument(),
    );

    const btn = screen.getByTestId(
      'payout-row-payout-1-mark-paid',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);

    await userEvent.type(
      screen.getByTestId('payout-row-payout-1-reference'),
      'NIBSS-12345',
    );
    expect(btn.disabled).toBe(false);
  });

  it('POSTs mark-paid with the typed reference and invalidates the queue', async () => {
    listMock.mockResolvedValueOnce({
      items: [
        {
          id: 'payout-1',
          recipientUserId: 'driver-1',
          recipient: { id: 'driver-1', first_name: 'T' },
          amount: 1000,
          status: 'pending_manual',
          periodStart: '2026-05-12T00:00:00.000Z',
          periodEnd: '2026-05-18T22:59:59.999Z',
          createdAt: '2026-05-19T00:00:00.000Z',
        },
      ],
      total: 1,
    });
    listMock.mockResolvedValueOnce({ items: [], total: 0 });

    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId('payout-row-payout-1')).toBeInTheDocument(),
    );

    await userEvent.type(
      screen.getByTestId('payout-row-payout-1-reference'),
      'NIBSS-12345',
    );
    await userEvent.click(
      screen.getByTestId('payout-row-payout-1-mark-paid'),
    );

    await waitFor(() =>
      expect(markPaidMock).toHaveBeenCalledWith('payout-1', 'NIBSS-12345'),
    );
  });

  it('surfaces an inline error when the markPaid call fails', async () => {
    listMock.mockResolvedValueOnce({
      items: [
        {
          id: 'payout-1',
          recipientUserId: 'driver-1',
          recipient: { id: 'driver-1' },
          amount: 1000,
          status: 'pending_manual',
          periodStart: '2026-05-12T00:00:00.000Z',
          periodEnd: '2026-05-18T22:59:59.999Z',
          createdAt: '2026-05-19T00:00:00.000Z',
        },
      ],
      total: 1,
    });
    markPaidMock.mockRejectedValueOnce(new Error('overdraft'));

    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId('payout-row-payout-1')).toBeInTheDocument(),
    );

    await userEvent.type(
      screen.getByTestId('payout-row-payout-1-reference'),
      'X',
    );
    await userEvent.click(
      screen.getByTestId('payout-row-payout-1-mark-paid'),
    );

    await waitFor(() =>
      expect(
        screen.getByTestId('payout-row-payout-1-error'),
      ).toBeInTheDocument(),
    );
  });
});
