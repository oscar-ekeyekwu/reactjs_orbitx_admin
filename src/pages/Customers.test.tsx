import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { getCustomersMock, getByIdMock, deleteMock, bulkDeleteMock } =
  vi.hoisted(() => ({
    getCustomersMock: vi.fn(),
    getByIdMock: vi.fn(),
    deleteMock: vi.fn(),
    bulkDeleteMock: vi.fn(),
  }));

vi.mock('@/services/api/users', () => ({
  usersApi: {
    getCustomers: getCustomersMock,
    getById: getByIdMock,
    delete: deleteMock,
    bulkDelete: bulkDeleteMock,
    update: vi.fn(),
    toggleActive: vi.fn(),
  },
}));

vi.mock('@/services/api/orders', () => ({
  ordersApi: {
    getAll: vi.fn().mockResolvedValue({
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }),
  },
}));

import { CustomersPage } from './Customers';
import { CustomerDetailPage } from './CustomerDetail';

function customer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c-1',
    email: 'ada@example.com',
    first_name: 'Ada',
    last_name: 'Obi',
    name: 'Ada Obi',
    phone: '+2348012345678',
    avatar: null,
    role: 'customer' as const,
    googleId: null,
    isEmailVerified: true,
    isPhoneVerified: false,
    isActive: true,
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-18T10:00:00.000Z',
    ...overrides,
  };
}

function page(rows: ReturnType<typeof customer>[]) {
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
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CustomersPage bulk delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the bulk bar only once a row is selected', async () => {
    getCustomersMock.mockResolvedValue(
      page([customer(), customer({ id: 'c-2', name: 'Bola Eze' })]),
    );
    renderWithRoutes('/customers');
    await screen.findByTestId('customers-row-c-1');
    expect(screen.queryByTestId('bulk-delete-bar')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('customers-select-c-1'));
    expect(screen.getByTestId('bulk-delete-bar')).toHaveTextContent(
      '1 customer selected',
    );
  });

  it('select-all picks every row on the page', async () => {
    getCustomersMock.mockResolvedValue(
      page([customer(), customer({ id: 'c-2', name: 'Bola Eze' })]),
    );
    renderWithRoutes('/customers');
    await screen.findByTestId('customers-row-c-1');
    await userEvent.click(screen.getByTestId('customers-select-all'));
    expect(screen.getByTestId('bulk-delete-bar')).toHaveTextContent(
      '2 customers selected',
    );
  });

  it('confirms, calls bulkDelete with the selected ids and reports the outcome', async () => {
    getCustomersMock.mockResolvedValue(
      page([customer(), customer({ id: 'c-2', name: 'Bola Eze' })]),
    );
    bulkDeleteMock.mockResolvedValue({
      deleted: ['c-1'],
      failed: [{ id: 'c-2', reason: 'owns a company with other members' }],
    });
    renderWithRoutes('/customers');
    await screen.findByTestId('customers-row-c-1');

    await userEvent.click(screen.getByTestId('customers-select-c-1'));
    await userEvent.click(screen.getByTestId('customers-select-c-2'));
    await userEvent.click(screen.getByTestId('bulk-delete-button'));
    await userEvent.click(
      screen.getByRole('button', { name: /Delete 2 customers/i }),
    );

    await waitFor(() => {
      expect(bulkDeleteMock).toHaveBeenCalledWith(['c-1', 'c-2']);
    });
    const result = await screen.findByTestId('bulk-delete-result');
    expect(result).toHaveTextContent('1 customer permanently deleted');
    expect(result).toHaveTextContent('1 could not be deleted');
    expect(result).toHaveTextContent('owns a company with other members');
    // The failed id stays selected so the admin can retry; the deleted
    // one is pruned.
    expect(screen.getByTestId('bulk-delete-bar')).toHaveTextContent(
      '1 customer selected',
    );
  });

  it('does not navigate into the row when the checkbox is clicked', async () => {
    getCustomersMock.mockResolvedValue(page([customer()]));
    renderWithRoutes('/customers');
    await screen.findByTestId('customers-row-c-1');
    await userEvent.click(screen.getByTestId('customers-select-c-1'));
    expect(getByIdMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('customers-row-c-1')).toBeInTheDocument();
  });
});

describe('CustomerDetailPage permanent delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('confirms, deletes and returns to the list', async () => {
    getByIdMock.mockResolvedValue(customer());
    getCustomersMock.mockResolvedValue(page([]));
    deleteMock.mockResolvedValue({ id: 'c-1', removed: { users: 1 } });
    renderWithRoutes('/customers/c-1');

    await userEvent.click(await screen.findByTestId('delete-user-button'));
    expect(
      screen.getByText(/Permanently delete Ada Obi\?/i),
    ).toBeInTheDocument();
    // Trigger button + dialog confirm share the label; the confirm is last.
    const buttons = screen.getAllByRole('button', {
      name: /^Delete permanently$/i,
    });
    await userEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith('c-1'));
    // Back on the list page.
    await waitFor(() =>
      expect(screen.getByText(/Manage your customer base/i)).toBeInTheDocument(),
    );
  });

  it('surfaces the backend reason when the purge is refused', async () => {
    getByIdMock.mockResolvedValue(customer());
    deleteMock.mockRejectedValue({
      response: { data: { message: 'You cannot delete your own account.' } },
    });
    renderWithRoutes('/customers/c-1');

    await userEvent.click(await screen.findByTestId('delete-user-button'));
    const dialogButtons = screen.getAllByRole('button', {
      name: /^Delete permanently$/i,
    });
    await userEvent.click(dialogButtons[dialogButtons.length - 1]);

    expect(await screen.findByTestId('delete-user-error')).toHaveTextContent(
      'You cannot delete your own account.',
    );
  });
});
