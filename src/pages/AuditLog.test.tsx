import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }));

vi.mock('@/services/api/audit-log', async () => {
  const actual = await vi.importActual<
    typeof import('@/services/api/audit-log')
  >('@/services/api/audit-log');
  return {
    ...actual,
    auditLogApi: { list: listMock, findByTarget: vi.fn() },
  };
});

import { AuditLogPage } from './AuditLog';
import { auditDecisionsToCsv } from '@/services/api/audit-log';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuditLogPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AuditLogPage (H7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the empty state when no rows match', async () => {
    listMock.mockResolvedValueOnce({ items: [], total: 0 });
    renderPage();
    await screen.findByTestId('audit-empty');
  });

  it('renders rows with the action badge + masked target id', async () => {
    listMock.mockResolvedValueOnce({
      items: [
        {
          id: 'a-1',
          targetType: 'driver',
          targetId: '11111111-2222-3333-4444-555566667777',
          action: 'approve',
          reviewerId: 'admin-1',
          reviewer: { id: 'admin-1', email: 'adaora@orbitx.com' },
          reason: 'Looks good',
          decidedAt: '2026-05-19T10:00:00.000Z',
        },
      ],
      total: 1,
    });

    renderPage();
    const row = await screen.findByTestId('audit-row-a-1');
    expect(row.textContent).toMatch(/driver/);
    expect(row.textContent).toMatch(/11111111/);
    expect(row.textContent).toMatch(/approve/);
    expect(row.textContent).toMatch(/adaora@orbitx\.com/);
  });

  it('reissues the query with target_type and action when filters change', async () => {
    listMock.mockResolvedValue({ items: [], total: 0 });
    renderPage();
    await screen.findByTestId('audit-empty');

    await userEvent.selectOptions(
      screen.getByTestId('audit-filter-target-type'),
      'company',
    );
    await waitFor(() => {
      const lastCall = listMock.mock.calls[listMock.mock.calls.length - 1];
      expect(lastCall[0]).toEqual(
        expect.objectContaining({ targetType: 'company' }),
      );
    });

    await userEvent.selectOptions(
      screen.getByTestId('audit-filter-action'),
      'suspend',
    );
    await waitFor(() => {
      const lastCall = listMock.mock.calls[listMock.mock.calls.length - 1];
      expect(lastCall[0]).toEqual(
        expect.objectContaining({ targetType: 'company', action: 'suspend' }),
      );
    });
  });

  it('Export CSV button is disabled when there are no rows', async () => {
    listMock.mockResolvedValueOnce({ items: [], total: 0 });
    renderPage();
    await screen.findByTestId('audit-empty');
    expect(screen.getByTestId('audit-export-csv')).toBeDisabled();
  });
});

describe('auditDecisionsToCsv', () => {
  it('serialises rows with the documented header + one row per decision', () => {
    const csv = auditDecisionsToCsv([
      {
        id: 'a',
        targetType: 'driver',
        targetId: 't1',
        action: 'approve',
        reviewerId: 'r1',
        reviewer: null,
        reason: 'ok',
        decidedAt: '2026-05-19T10:00:00.000Z',
      },
    ]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe(
      'decided_at,target_type,target_id,action,reviewer,reason',
    );
    expect(lines[1]).toMatch(/^2026-05-19T10:00:00\.000Z,driver,t1,approve,r1,ok$/);
  });

  it('escapes quotes + commas + newlines per RFC 4180', () => {
    const csv = auditDecisionsToCsv([
      {
        id: 'a',
        targetType: 'driver',
        targetId: 't1',
        action: 'reject',
        reviewerId: null,
        reviewer: null,
        reason: 'doc said "expired"\nin the second pass, please retry',
        decidedAt: '2026-05-19T10:00:00.000Z',
      },
    ]);
    expect(csv).toMatch(/"doc said ""expired""\nin the second pass, please retry"/);
  });
});
