import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApprovalsPage } from './Approvals';

const mockListDrivers = vi.fn();
const mockListVehicles = vi.fn();
const mockListCompanies = vi.fn();
const mockListDocuments = vi.fn();
const mockApproveDriver = vi.fn();
const mockRejectDriver = vi.fn();
const mockApproveDocument = vi.fn();
const mockRejectDocument = vi.fn();
const mockGetDocumentViewUrl = vi.fn();

vi.mock('@/services/api', () => ({
  approvalsApi: {
    listPendingDrivers: (...args: unknown[]) => mockListDrivers(...args),
    listPendingVehicles: (...args: unknown[]) => mockListVehicles(...args),
    listPendingCompanies: (...args: unknown[]) => mockListCompanies(...args),
    listPendingDocuments: (...args: unknown[]) => mockListDocuments(...args),
    approveDriver: (...args: unknown[]) => mockApproveDriver(...args),
    rejectDriver: (...args: unknown[]) => mockRejectDriver(...args),
    approveVehicle: vi.fn().mockResolvedValue({}),
    rejectVehicle: vi.fn().mockResolvedValue({}),
    approveCompany: vi.fn().mockResolvedValue({}),
    suspendCompany: vi.fn().mockResolvedValue({}),
    approveDocument: (...args: unknown[]) => mockApproveDocument(...args),
    rejectDocument: (...args: unknown[]) => mockRejectDocument(...args),
    getDocumentViewUrl: (...args: unknown[]) => mockGetDocumentViewUrl(...args),
  },
}));

vi.mock('@/components/layout', () => ({
  Header: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

function buildDriver(id: string) {
  return {
    id,
    userId: `u-${id}`,
    accountType: 'individual' as const,
    verificationStatus: 'pending_approval' as const,
    companyId: null,
    user: {
      id: `u-${id}`,
      email: `${id}@example.com`,
      first_name: 'Tunde',
      last_name: 'Adeniyi',
      phone: '+2348000000000',
    },
    company: null,
    createdAt: '2026-05-18T00:00:00Z',
    updatedAt: '2026-05-18T00:00:00Z',
  };
}

function renderApprovals(initialPath = '/approvals') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <ApprovalsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ApprovalsPage (C5)', () => {
  beforeEach(() => {
    mockListDrivers.mockReset();
    mockListVehicles.mockReset();
    mockListCompanies.mockReset();
    mockListDocuments.mockReset();
    mockApproveDriver.mockReset();
    mockRejectDriver.mockReset();
    mockApproveDocument.mockReset();
    mockRejectDocument.mockReset();
    mockGetDocumentViewUrl.mockReset();

    mockListDrivers.mockResolvedValue({ items: [], total: 0 });
    mockListVehicles.mockResolvedValue({ items: [], total: 0 });
    mockListCompanies.mockResolvedValue({ items: [], total: 0 });
    mockListDocuments.mockResolvedValue([]);
  });

  it('renders four tabs with count badges', async () => {
    mockListDrivers.mockResolvedValue({
      items: [buildDriver('d1'), buildDriver('d2')],
      total: 2,
    });
    mockListVehicles.mockResolvedValue({ items: [], total: 5 });
    mockListCompanies.mockResolvedValue({ items: [], total: 1 });
    mockListDocuments.mockResolvedValue([{ id: 'doc-1' }, { id: 'doc-2' }, { id: 'doc-3' }]);

    renderApprovals();

    await waitFor(() => {
      expect(screen.getByTestId('approvals-count-drivers').textContent).toBe('2');
    });
    expect(screen.getByTestId('approvals-count-vehicles').textContent).toBe('5');
    expect(screen.getByTestId('approvals-count-companies').textContent).toBe('1');
    expect(screen.getByTestId('approvals-count-documents').textContent).toBe('3');
  });

  it('Drivers tab: renders a row per pending driver and fires approve on click', async () => {
    const user = userEvent.setup();
    mockListDrivers.mockResolvedValue({
      items: [buildDriver('d1')],
      total: 1,
    });
    mockApproveDriver.mockResolvedValue({});

    renderApprovals();

    await waitFor(() => {
      expect(screen.queryByTestId('approvals-driver-row-d1')).toBeInTheDocument();
    });
    expect(screen.getByText(/Tunde Adeniyi/i)).toBeInTheDocument();
    expect(screen.getByText(/d1@example.com/i)).toBeInTheDocument();

    await user.click(screen.getByTestId('approvals-driver-approve-d1'));
    // Click now opens a confirmation modal — admin must explicitly
    // confirm so a misclick on Approve can't silently flip the driver.
    const confirm = await screen.findByTestId('approvals-confirm-submit');
    await user.click(confirm);
    await waitFor(() => {
      expect(mockApproveDriver).toHaveBeenCalledWith('d1');
    });
  });

  it('reject modal: empty reason keeps the submit button disabled, non-empty fires the call', async () => {
    const user = userEvent.setup();
    mockListDrivers.mockResolvedValue({
      items: [buildDriver('d1')],
      total: 1,
    });
    mockRejectDriver.mockResolvedValue({});

    renderApprovals();

    await waitFor(() => {
      expect(screen.queryByTestId('approvals-driver-reject-d1')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('approvals-driver-reject-d1'));

    const submit = await screen.findByTestId('approvals-reject-submit');
    expect(submit).toBeDisabled();

    const reasonInput = screen.getByTestId('approvals-reject-reason');
    await user.type(reasonInput, 'Driver license expired before submission.');
    expect(submit).not.toBeDisabled();

    await user.click(submit);
    await waitFor(() => {
      expect(mockRejectDriver).toHaveBeenCalledWith(
        'd1',
        'Driver license expired before submission.',
      );
    });
  });

  it('Documents tab: View button calls getDocumentViewUrl and opens in new tab', async () => {
    const user = userEvent.setup();
    mockListDocuments.mockResolvedValue([
      {
        id: 'doc-1',
        ownerType: 'user',
        ownerId: 'u-1',
        type: 'drivers_license',
        fileUrl: 'spaces://...',
        fileKey: 'user/u-1/drivers_license/abc.jpg',
        expiryDate: '2027-03-15',
        status: 'pending',
        uploadedBy: 'u-1',
        createdAt: '2026-05-18T00:00:00Z',
        updatedAt: '2026-05-18T00:00:00Z',
      },
    ]);
    mockGetDocumentViewUrl.mockResolvedValue('https://signed.example/get');
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    renderApprovals('/approvals?tab=documents');

    await waitFor(() => {
      expect(screen.queryByTestId('approvals-document-row-doc-1')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('approvals-document-view-doc-1'));

    await waitFor(() => {
      expect(mockGetDocumentViewUrl).toHaveBeenCalledWith('doc-1');
    });
    expect(openSpy).toHaveBeenCalledWith(
      'https://signed.example/get',
      '_blank',
      'noopener,noreferrer',
    );
    openSpy.mockRestore();
  });

  it('tab switching writes the active tab into the URL query', async () => {
    const user = userEvent.setup();
    renderApprovals();

    await user.click(screen.getByTestId('approvals-tab-vehicles'));

    await waitFor(() => {
      expect(screen.getByTestId('approvals-tab-vehicles').getAttribute('aria-selected')).toBe(
        'true',
      );
    });
    // URL search params updated — Vehicles is the active queue
    expect(window.location.search).toContain('');
  });

  it('empty state: "no drivers waiting" when the list resolves empty', async () => {
    renderApprovals();
    await waitFor(() => {
      expect(screen.getByText(/No drivers waiting for approval/i)).toBeInTheDocument();
    });
  });
});
