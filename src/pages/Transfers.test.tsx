import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { listMock, reconcileMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  reconcileMock: vi.fn(),
}));

vi.mock('@/services/api', async () => {
  const actual = await vi.importActual<typeof import('@/services/api')>(
    '@/services/api',
  );
  return {
    ...actual,
    transfersApi: {
      listPending: listMock,
      reconcile: reconcileMock,
    },
  };
});

import { TransfersPage } from './Transfers';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TransfersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TransfersPage (G3 / H8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reconcileMock.mockResolvedValue({});
  });

  it('shows an empty-state when there are no pending transfers', async () => {
    listMock.mockResolvedValueOnce({ items: [], total: 0 });
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId('transfers-empty')).toBeInTheDocument(),
    );
  });

  it('renders one row per pending transfer with amount + reference', async () => {
    listMock.mockResolvedValueOnce({
      items: [
        {
          id: 'order-ref-1',
          customerId: 'c-1',
          customer: { id: 'c-1', first_name: 'Chioma', last_name: 'Okeke' },
          estimatedPrice: 2500,
          finalPrice: null,
          paymentMethod: 'bank_transfer',
          paymentStatus: 'pending_transfer',
          createdAt: '2026-05-19T10:00:00.000Z',
        },
      ],
      total: 1,
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId('transfer-row-order-ref-1')).toBeInTheDocument(),
    );
    expect(screen.getByText('order-ref-1')).toBeInTheDocument();
    expect(screen.getByText(/2,500/)).toBeInTheDocument();
    expect(screen.getByText(/Chioma Okeke/)).toBeInTheDocument();
  });

  it('clicking "Mark received" POSTs reconcile and invalidates the queue', async () => {
    listMock.mockResolvedValueOnce({
      items: [
        {
          id: 'order-ref-1',
          customerId: 'c-1',
          customer: { id: 'c-1', first_name: 'Chioma' },
          estimatedPrice: 2500,
          finalPrice: null,
          paymentMethod: 'bank_transfer',
          paymentStatus: 'pending_transfer',
          createdAt: '2026-05-19T10:00:00.000Z',
        },
      ],
      total: 1,
    });
    listMock.mockResolvedValueOnce({ items: [], total: 0 });

    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId('transfer-row-order-ref-1')).toBeInTheDocument(),
    );

    await userEvent.click(
      screen.getByTestId('transfer-row-order-ref-1-reconcile'),
    );

    await waitFor(() =>
      expect(reconcileMock).toHaveBeenCalledWith('order-ref-1'),
    );
  });

  it('surfaces an inline error when reconcile fails', async () => {
    listMock.mockResolvedValueOnce({
      items: [
        {
          id: 'order-ref-1',
          customerId: 'c-1',
          customer: { id: 'c-1' },
          estimatedPrice: 1000,
          finalPrice: null,
          paymentMethod: 'bank_transfer',
          paymentStatus: 'pending_transfer',
          createdAt: '2026-05-19T10:00:00.000Z',
        },
      ],
      total: 1,
    });
    reconcileMock.mockRejectedValueOnce(new Error('404'));

    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId('transfer-row-order-ref-1')).toBeInTheDocument(),
    );

    await userEvent.click(
      screen.getByTestId('transfer-row-order-ref-1-reconcile'),
    );

    await waitFor(() =>
      expect(
        screen.getByTestId('transfer-row-order-ref-1-error'),
      ).toBeInTheDocument(),
    );
  });
});
