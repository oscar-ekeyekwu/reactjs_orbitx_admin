import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { getDriversMock, getByIdMock, deleteMock, bulkDeleteMock, emptyPage } =
  vi.hoisted(() => ({
    getDriversMock: vi.fn(),
    getByIdMock: vi.fn(),
    deleteMock: vi.fn(),
    bulkDeleteMock: vi.fn(),
    // Referenced inside a vi.mock factory, so it has to be hoisted too.
    emptyPage: {
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    },
  }));

vi.mock('@/services/api/users', () => ({
  usersApi: {
    getDrivers: getDriversMock,
    getById: getByIdMock,
    delete: deleteMock,
    bulkDelete: bulkDeleteMock,
    createDriver: vi.fn(),
    update: vi.fn(),
    toggleActive: vi.fn(),
    getDriverProfileByUser: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@/services/api/orders', () => ({
  ordersApi: { getAll: vi.fn().mockResolvedValue(emptyPage) },
}));

vi.mock('@/services/api/documents', async () => {
  const actual = await vi.importActual<
    typeof import('@/services/api/documents')
  >('@/services/api/documents');
  return {
    ...actual,
    adminDocumentsApi: {
      list: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      review: vi.fn(),
      viewUrl: vi.fn(),
    },
  };
});

import { DriversPage } from './Drivers';
import { DriverDetailPage } from './DriverDetail';

function driver(overrides: Record<string, unknown> = {}) {
  return {
    id: 'd-1',
    email: 'tunde@example.com',
    first_name: 'Tunde',
    last_name: 'Ade',
    name: 'Tunde Ade',
    phone: '+2348012345678',
    avatar: null,
    role: 'driver' as const,
    googleId: null,
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-18T10:00:00.000Z',
    ...overrides,
  };
}

function page(rows: ReturnType<typeof driver>[]) {
  return {
    data: rows,
    meta: {
      total: rows.length,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

function renderWithRoutes(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/drivers/:id" element={<DriverDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DriversPage bulk delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('selects rows and purges them through bulkDelete', async () => {
    getDriversMock.mockResolvedValue(
      page([driver(), driver({ id: 'd-2', name: 'Bisi Oke' })]),
    );
    bulkDeleteMock.mockResolvedValue({ deleted: ['d-1', 'd-2'], failed: [] });
    renderWithRoutes('/drivers');
    await screen.findByTestId('drivers-row-d-1');

    await userEvent.click(screen.getByTestId('drivers-select-all'));
    expect(screen.getByTestId('bulk-delete-bar')).toHaveTextContent(
      '2 drivers selected',
    );
    await userEvent.click(screen.getByTestId('bulk-delete-button'));
    await userEvent.click(
      screen.getByRole('button', { name: /Delete 2 drivers/i }),
    );

    await waitFor(() =>
      expect(bulkDeleteMock).toHaveBeenCalledWith(['d-1', 'd-2']),
    );
    expect(await screen.findByTestId('bulk-delete-result')).toHaveTextContent(
      '2 drivers permanently deleted',
    );
    expect(screen.queryByTestId('bulk-delete-bar')).not.toBeInTheDocument();
  });
});

describe('DriverDetailPage permanent delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('confirms, deletes and returns to the drivers list', async () => {
    getByIdMock.mockResolvedValue(driver());
    getDriversMock.mockResolvedValue(page([]));
    deleteMock.mockResolvedValue({ id: 'd-1', removed: { users: 1 } });
    renderWithRoutes('/drivers/d-1');

    await userEvent.click(await screen.findByTestId('delete-user-button'));
    const buttons = screen.getAllByRole('button', {
      name: /^Delete permanently$/i,
    });
    await userEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith('d-1'));
    await waitFor(() =>
      expect(
        screen.getByText(/Manage and onboard drivers/i),
      ).toBeInTheDocument(),
    );
  });
});
