import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { listMigrationsMock, listProvidersMock } = vi.hoisted(() => ({
  listMigrationsMock: vi.fn(),
  listProvidersMock: vi.fn(),
}));

vi.mock('@/services/api', async () => {
  const actual = await vi.importActual<typeof import('@/services/api')>(
    '@/services/api',
  );
  return {
    ...actual,
    storageMigrationsApi: {
      list: listMigrationsMock,
      findOne: vi.fn(),
      failures: vi.fn(),
      start: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
    },
    storageProvidersApi: {
      list: listProvidersMock,
    },
  };
});

import { StorageMigrationsPage } from './StorageMigrations';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <StorageMigrationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('StorageMigrationsPage (STG-4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listProvidersMock.mockResolvedValue([
      { id: 'src', slug: 'spaces', displayName: 'DO Spaces' },
      { id: 'dst', slug: 'supabase-eu', displayName: 'Supabase EU' },
    ]);
  });

  it('renders the empty state when no migrations exist', async () => {
    listMigrationsMock.mockResolvedValueOnce([]);
    renderPage();
    await screen.findByTestId('storage-migrations-empty');
  });

  it('renders one row per migration with provider labels resolved', async () => {
    listMigrationsMock.mockResolvedValueOnce([
      {
        id: 'mig-1',
        fromProviderId: 'src',
        toProviderId: 'dst',
        status: 'running',
        dryRun: false,
        batchSize: 25,
        since: null,
        queuedAt: '2026-05-19T10:00:00.000Z',
        queuedUntilCreatedAt: '2026-05-19T10:00:00.000Z',
        startedAt: '2026-05-19T10:00:01.000Z',
        finishedAt: null,
        totalDocuments: 100,
        migratedCount: 25,
        wouldMigrateCount: 0,
        failedCount: 0,
        skippedCount: 0,
        lastDocumentId: null,
        startedBy: 'admin',
        errorMessage: null,
        createdAt: '2026-05-19T10:00:00.000Z',
        updatedAt: '2026-05-19T10:00:30.000Z',
      },
    ]);
    renderPage();
    const row = await screen.findByTestId('storage-migration-row-mig-1');
    expect(row.textContent).toMatch(/DO Spaces/);
    expect(row.textContent).toMatch(/Supabase EU/);
    // Progress column shows `<done> / <total>` for a non-dryRun row.
    expect(row.textContent).toMatch(/25 \/ 100/);
  });

  it('renders the dry-run progress shape (would-migrate / total)', async () => {
    listMigrationsMock.mockResolvedValueOnce([
      {
        id: 'mig-2',
        fromProviderId: 'src',
        toProviderId: 'dst',
        status: 'completed',
        dryRun: true,
        batchSize: 25,
        since: null,
        queuedAt: '2026-05-19T10:00:00.000Z',
        queuedUntilCreatedAt: '2026-05-19T10:00:00.000Z',
        startedAt: '2026-05-19T10:00:01.000Z',
        finishedAt: '2026-05-19T10:05:00.000Z',
        totalDocuments: 50,
        migratedCount: 0,
        wouldMigrateCount: 48,
        failedCount: 2,
        skippedCount: 0,
        lastDocumentId: null,
        startedBy: 'admin',
        errorMessage: null,
        createdAt: '2026-05-19T10:00:00.000Z',
        updatedAt: '2026-05-19T10:05:00.000Z',
      },
    ]);
    renderPage();
    const row = await screen.findByTestId('storage-migration-row-mig-2');
    expect(row.textContent).toMatch(/48 \/ 50/);
    await waitFor(() => expect(row.textContent).toMatch(/dry run/i));
  });
});
