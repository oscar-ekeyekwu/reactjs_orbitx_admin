import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { addDays, formatISO } from 'date-fns';

// Far enough out to stay green regardless of when the suite runs.
const FAR_FUTURE_EXPIRY = formatISO(addDays(new Date(), 365), {
  representation: 'date',
});

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }));

vi.mock('@/services/api/documents', async () => {
  const actual = await vi.importActual<
    typeof import('@/services/api/documents')
  >('@/services/api/documents');
  return {
    ...actual,
    adminDocumentsApi: {
      list: listMock,
      findOne: vi.fn(),
      review: vi.fn(),
      viewUrl: vi.fn(),
    },
  };
});

import { DocumentsPage } from './Documents';
import { expiryBand } from '@/services/api/documents';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function doc(overrides: Record<string, unknown> = {}) {
  return {
    id: 'd-1',
    ownerType: 'user' as const,
    ownerId: '11111111-2222-3333-4444-555566667777',
    type: 'drivers_license' as const,
    fileUrl: 'https://example/file',
    fileKey: 'user/u/drivers_license/abc.jpg',
    expiryDate: FAR_FUTURE_EXPIRY,
    status: 'approved' as const,
    uploadedBy: 'u-1',
    reviewedAt: '2026-05-19T10:00:00.000Z',
    reviewedBy: 'admin-1',
    rejectionReason: null,
    createdAt: '2026-05-18T10:00:00.000Z',
    updatedAt: '2026-05-19T10:00:00.000Z',
    ...overrides,
  };
}

describe('DocumentsPage (H5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state', async () => {
    listMock.mockResolvedValueOnce([]);
    renderPage();
    await screen.findByTestId('documents-empty');
  });

  it('renders rows with the expiry pill in the right band', async () => {
    listMock.mockResolvedValueOnce([doc()]);
    renderPage();
    const row = await screen.findByTestId('documents-row-d-1');
    // Friendly label replaces the slug per documentTypeLabel().
    expect(row.textContent).toMatch(/Driver's License/);
    // Far-future expiry → green pill.
    expect(
      row.querySelector('[data-testid="expiry-pill-green"]'),
    ).toBeTruthy();
  });

  it('passes expiringInDays to the API when the filter changes', async () => {
    listMock.mockResolvedValue([]);
    renderPage();
    await screen.findByTestId('documents-empty');

    await userEvent.selectOptions(
      screen.getByTestId('documents-filter-expiry'),
      '30',
    );
    await waitFor(() => {
      const last = listMock.mock.calls[listMock.mock.calls.length - 1];
      expect(last[0]).toEqual(
        expect.objectContaining({ expiringInDays: 30 }),
      );
    });
  });
});

describe('expiryBand helper', () => {
  const ref = new Date('2026-05-20T00:00:00Z');

  it('returns green for expiry > 30 days out', () => {
    expect(expiryBand('2026-08-01', ref)).toBe('green');
  });

  it('returns amber for expiry in 7–30 days', () => {
    expect(expiryBand('2026-06-15', ref)).toBe('amber');
  });

  it('returns red for expiry < 7 days but still in the future', () => {
    expect(expiryBand('2026-05-22', ref)).toBe('red');
  });

  it('returns gray for already-expired docs', () => {
    expect(expiryBand('2026-05-10', ref)).toBe('gray');
  });

  it('returns "none" when expiryDate is null', () => {
    expect(expiryBand(null, ref)).toBe('none');
  });
});
