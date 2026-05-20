import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { listMock, findOneMock, updateStatusMock, auditFindByTargetMock } =
  vi.hoisted(() => ({
    listMock: vi.fn(),
    findOneMock: vi.fn(),
    updateStatusMock: vi.fn(),
    auditFindByTargetMock: vi.fn(),
  }));

vi.mock('@/services/api/vehicles', () => ({
  adminVehiclesApi: {
    list: listMock,
    findOne: findOneMock,
    updateStatus: updateStatusMock,
  },
}));

vi.mock('@/services/api/audit-log', () => ({
  auditLogApi: {
    list: vi.fn(),
    findByTarget: auditFindByTargetMock,
  },
  auditDecisionsToCsv: vi.fn(),
}));

import { VehiclesPage } from './Vehicles';
import { VehicleDetailPage } from './VehicleDetail';

function renderList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/vehicles']}>
        <Routes>
          <Route path="/vehicles" element={<VehiclesPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function vehicle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'v-1',
    type: 'motorbike',
    plate: 'LAG-123-AA',
    color: 'red',
    photoUrl: null,
    status: 'approved' as const,
    owner: { type: 'individual_driver' as const, id: 'driver-1' },
    approvedAt: '2026-05-19T10:00:00.000Z',
    approvedBy: 'admin-1',
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-19T10:00:00.000Z',
    ownerName: 'Tunde A.',
    ...overrides,
  };
}

describe('VehiclesPage (H4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditFindByTargetMock.mockResolvedValue([]);
  });

  it('renders empty state', async () => {
    listMock.mockResolvedValueOnce({ items: [], total: 0 });
    renderList();
    await screen.findByTestId('vehicles-empty');
  });

  it('shows plate + owner name + status badge', async () => {
    listMock.mockResolvedValueOnce({ items: [vehicle()], total: 1 });
    renderList();
    const row = await screen.findByTestId('vehicles-row-v-1');
    expect(row.textContent).toMatch(/LAG-123-AA/);
    expect(row.textContent).toMatch(/Tunde A\./);
    expect(row.textContent).toMatch(/approved/);
  });

  it('refetches with status filter', async () => {
    listMock.mockResolvedValue({ items: [], total: 0 });
    renderList();
    await screen.findByTestId('vehicles-empty');
    await userEvent.selectOptions(
      screen.getByTestId('vehicles-filter-status'),
      'pending_approval',
    );
    await waitFor(() => {
      const last = listMock.mock.calls[listMock.mock.calls.length - 1];
      expect(last[0]).toEqual(
        expect.objectContaining({ status: 'pending_approval' }),
      );
    });
  });
});

describe('VehicleDetailPage (H4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderDetail() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/vehicles/v-1']}>
          <Routes>
            <Route
              path="/vehicles/:id"
              element={<VehicleDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it('Suspend modal requires a reason and PATCHes status=suspended', async () => {
    findOneMock.mockResolvedValue(vehicle());
    auditFindByTargetMock.mockResolvedValue([]);
    updateStatusMock.mockResolvedValueOnce(
      vehicle({ status: 'suspended' }),
    );

    renderDetail();
    await userEvent.click(await screen.findByTestId('vehicle-suspend'));

    const submit = await screen.findByTestId('vehicle-suspend-submit');
    expect(submit).toBeDisabled();
    await userEvent.type(
      screen.getByTestId('vehicle-suspend-reason'),
      'Insurance lapsed; per FRSC roadblock report.',
    );
    expect(submit).toBeEnabled();
    await userEvent.click(submit);
    await waitFor(() =>
      expect(updateStatusMock).toHaveBeenCalledWith('v-1', {
        status: 'suspended',
        reason: 'Insurance lapsed; per FRSC roadblock report.',
      }),
    );
  });

  it('Resume button appears on suspended vehicles', async () => {
    findOneMock.mockResolvedValueOnce(vehicle({ status: 'suspended' }));
    auditFindByTargetMock.mockResolvedValueOnce([]);
    renderDetail();
    await screen.findByTestId('vehicle-resume');
    expect(screen.queryByTestId('vehicle-suspend')).not.toBeInTheDocument();
  });
});
