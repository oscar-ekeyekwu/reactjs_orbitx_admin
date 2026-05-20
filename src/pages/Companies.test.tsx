import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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

vi.mock('@/services/api/companies', () => ({
  adminCompaniesApi: {
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

import { CompaniesPage } from './Companies';
import { CompanyDetailPage } from './CompanyDetail';

function renderList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/companies']}>
        <Routes>
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:id" element={<CompanyDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function company(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c-1',
    legalName: 'Adebayo Logistics Ltd',
    cacNumber: 'RC1234567',
    tin: '12345678-0001',
    address: '12 Adeola Odeku St, VI',
    status: 'approved' as const,
    createdBy: 'owner-1',
    createdByUser: {
      id: 'owner-1',
      email: 'owner@adebayo.com',
      name: 'Adebayo Owner',
    },
    vehicleCount: 4,
    driverCount: 6,
    createdAt: '2026-05-19T10:00:00.000Z',
    updatedAt: '2026-05-19T10:00:00.000Z',
    ...overrides,
  };
}

describe('CompaniesPage (H2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditFindByTargetMock.mockResolvedValue([]);
  });

  it('renders empty state when no companies', async () => {
    listMock.mockResolvedValueOnce({ items: [], total: 0 });
    renderList();
    await screen.findByTestId('companies-empty');
  });

  it('renders a row per company with status badge', async () => {
    listMock.mockResolvedValueOnce({ items: [company()], total: 1 });
    renderList();
    const row = await screen.findByTestId('companies-row-c-1');
    expect(row.textContent).toMatch(/Adebayo Logistics Ltd/);
    expect(row.textContent).toMatch(/RC1234567/);
    expect(row.textContent).toMatch(/approved/i);
  });

  it('filters by status when the dropdown changes', async () => {
    listMock.mockResolvedValue({ items: [], total: 0 });
    renderList();
    await screen.findByTestId('companies-empty');
    await userEvent.selectOptions(
      screen.getByTestId('companies-filter-status'),
      'suspended',
    );
    await waitFor(() => {
      const lastCall = listMock.mock.calls[listMock.mock.calls.length - 1];
      expect(lastCall[0]).toEqual(
        expect.objectContaining({ status: 'suspended' }),
      );
    });
  });

  it('client-side search narrows by legal name OR CAC', async () => {
    listMock.mockResolvedValueOnce({
      items: [
        company({ id: 'c-1', legalName: 'Adebayo Logistics' }),
        company({ id: 'c-2', legalName: 'Zenith Movers', cacNumber: 'RC999' }),
      ],
      total: 2,
    });
    renderList();
    await screen.findByTestId('companies-row-c-1');
    await userEvent.type(screen.getByTestId('companies-search'), 'zenith');
    expect(
      screen.queryByTestId('companies-row-c-1'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('companies-row-c-2')).toBeInTheDocument();
  });
});

describe('CompanyDetailPage (H2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the company header + Suspend button when approved', async () => {
    findOneMock.mockResolvedValueOnce(company());
    auditFindByTargetMock.mockResolvedValueOnce([]);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/companies/c-1']}>
          <Routes>
            <Route
              path="/companies/:id"
              element={<CompanyDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const title = await screen.findByTestId('company-detail-title');
    expect(title.textContent).toMatch(/Adebayo Logistics Ltd/);
    expect(screen.getByTestId('company-suspend')).toBeEnabled();
    expect(screen.queryByTestId('company-resume')).not.toBeInTheDocument();
  });

  it('Suspend modal requires a reason and PATCHes with status=suspended', async () => {
    findOneMock.mockResolvedValue(company());
    auditFindByTargetMock.mockResolvedValue([]);
    updateStatusMock.mockResolvedValueOnce(company({ status: 'suspended' }));

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/companies/c-1']}>
          <Routes>
            <Route
              path="/companies/:id"
              element={<CompanyDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await userEvent.click(await screen.findByTestId('company-suspend'));
    const modal = await screen.findByTestId('company-suspend-modal');
    const submit = within(modal).getByTestId('company-suspend-submit');

    // Empty reason → disabled.
    expect(submit).toBeDisabled();
    await userEvent.type(
      within(modal).getByTestId('company-suspend-reason'),
      'Documents missing per audit on 2026-05-19.',
    );
    expect(submit).toBeEnabled();
    await userEvent.click(submit);
    await waitFor(() =>
      expect(updateStatusMock).toHaveBeenCalledWith('c-1', {
        status: 'suspended',
        reason: 'Documents missing per audit on 2026-05-19.',
      }),
    );
  });

  it('shows the Resume button when the company is already suspended', async () => {
    findOneMock.mockResolvedValueOnce(company({ status: 'suspended' }));
    auditFindByTargetMock.mockResolvedValueOnce([]);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/companies/c-1']}>
          <Routes>
            <Route
              path="/companies/:id"
              element={<CompanyDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findByTestId('company-resume');
    expect(screen.queryByTestId('company-suspend')).not.toBeInTheDocument();
  });

  it('renders approval history rows when present', async () => {
    findOneMock.mockResolvedValueOnce(company());
    auditFindByTargetMock.mockResolvedValueOnce([
      {
        id: 'd-1',
        targetType: 'company',
        targetId: 'c-1',
        action: 'approve',
        reviewerId: 'admin-1',
        reviewer: { id: 'admin-1', email: 'adaora@orbitx.com' },
        reason: 'CAC verified',
        decidedAt: '2026-05-19T10:00:00.000Z',
      },
    ]);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/companies/c-1']}>
          <Routes>
            <Route
              path="/companies/:id"
              element={<CompanyDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findByTestId('company-audit-row-d-1');
    expect(
      screen.getByTestId('company-audit-row-d-1').textContent,
    ).toMatch(/CAC verified/);
  });
});
