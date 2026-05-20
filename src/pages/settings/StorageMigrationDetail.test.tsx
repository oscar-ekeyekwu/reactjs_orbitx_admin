import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const {
  findOneMock,
  failuresMock,
  listProvidersMock,
  pauseMock,
  resumeMock,
  verifyMock,
  verificationsMock,
  deleteSourceMock,
  deletionsMock,
} = vi.hoisted(() => ({
  findOneMock: vi.fn(),
  failuresMock: vi.fn(),
  listProvidersMock: vi.fn(),
  pauseMock: vi.fn(),
  resumeMock: vi.fn(),
  verifyMock: vi.fn(),
  verificationsMock: vi.fn(),
  deleteSourceMock: vi.fn(),
  deletionsMock: vi.fn(),
}));

vi.mock('@/services/api', async () => {
  const actual = await vi.importActual<typeof import('@/services/api')>(
    '@/services/api',
  );
  return {
    ...actual,
    storageMigrationsApi: {
      list: vi.fn(),
      findOne: findOneMock,
      failures: failuresMock,
      start: vi.fn(),
      pause: pauseMock,
      resume: resumeMock,
      verify: verifyMock,
      verifications: verificationsMock,
      deleteSource: deleteSourceMock,
      deletions: deletionsMock,
    },
    storageProvidersApi: {
      list: listProvidersMock,
    },
  };
});

import { StorageMigrationDetailPage } from './StorageMigrationDetail';

function renderDetail(id = 'mig-1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/settings/storage/migrations/${id}`]}>
        <Routes>
          <Route
            path="/settings/storage/migrations/:id"
            element={<StorageMigrationDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function buildMigration(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mig-1',
    fromProviderId: 'src',
    toProviderId: 'dst',
    status: 'running' as const,
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
    lastDocumentId: 'doc-25',
    startedBy: 'admin',
    errorMessage: null,
    sourceDeletedAt: null,
    createdAt: '2026-05-19T10:00:00.000Z',
    updatedAt: '2026-05-19T10:00:30.000Z',
    ...overrides,
  };
}

function verification(overrides: Record<string, unknown> = {}) {
  return {
    id: 'verif-1',
    migrationId: 'mig-1',
    status: 'completed' as const,
    verifiedCount: 100,
    missingAtDestination: 0,
    totalChecked: 100,
    startedAt: '2026-05-19T11:00:00.000Z',
    finishedAt: '2026-05-19T11:00:05.000Z',
    createdAt: '2026-05-19T11:00:00.000Z',
    updatedAt: '2026-05-19T11:00:05.000Z',
    ...overrides,
  };
}

describe('StorageMigrationDetailPage (STG-4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listProvidersMock.mockResolvedValue([
      {
        id: 'src',
        slug: 'spaces-default',
        displayName: 'DO Spaces',
      },
      {
        id: 'dst',
        slug: 'supabase-eu',
        displayName: 'Supabase EU',
      },
    ]);
    failuresMock.mockResolvedValue([]);
    verificationsMock.mockResolvedValue([]);
    deletionsMock.mockResolvedValue([]);
  });

  it('renders the progress bar with the right percentage', async () => {
    findOneMock.mockResolvedValueOnce(buildMigration());
    renderDetail();
    const bar = await screen.findByTestId('storage-migration-progress');
    expect(bar.getAttribute('data-pct')).toBe('25');
  });

  it('shows a Pause button while running and pause fires when clicked', async () => {
    findOneMock.mockResolvedValueOnce(buildMigration({ status: 'running' }));
    pauseMock.mockResolvedValueOnce(buildMigration({ status: 'paused' }));

    renderDetail();
    const pauseBtn = await screen.findByTestId('storage-migration-pause');
    await userEvent.click(pauseBtn);
    await waitFor(() => expect(pauseMock).toHaveBeenCalledWith('mig-1'));
  });

  it('shows a Resume button while paused and resume fires when clicked', async () => {
    findOneMock.mockResolvedValueOnce(buildMigration({ status: 'paused' }));
    resumeMock.mockResolvedValueOnce(buildMigration({ status: 'running' }));

    renderDetail();
    const resumeBtn = await screen.findByTestId('storage-migration-resume');
    await userEvent.click(resumeBtn);
    await waitFor(() => expect(resumeMock).toHaveBeenCalledWith('mig-1'));
  });

  it('does NOT show a Pause button on a completed migration', async () => {
    findOneMock.mockResolvedValueOnce(
      buildMigration({
        status: 'completed',
        finishedAt: '2026-05-19T11:00:00.000Z',
        migratedCount: 100,
      }),
    );
    renderDetail();
    await screen.findByTestId('storage-migration-progress');
    expect(
      screen.queryByTestId('storage-migration-pause'),
    ).not.toBeInTheDocument();
  });

  it('renders the loop-level error banner when migration failed at the loop level', async () => {
    findOneMock.mockResolvedValueOnce(
      buildMigration({
        status: 'completed_with_errors',
        errorMessage: 'credential decrypt failed',
      }),
    );
    renderDetail();
    const err = await screen.findByTestId('storage-migration-loop-error');
    expect(err.textContent).toMatch(/credential decrypt failed/);
  });

  it('renders failure rows inline', async () => {
    findOneMock.mockResolvedValueOnce(
      buildMigration({
        status: 'completed_with_errors',
        failedCount: 1,
      }),
    );
    failuresMock.mockResolvedValueOnce([
      {
        id: 'fail-1',
        documentId: 'doc-deadbeef-uuid',
        errorMessage: 'AccessDenied',
        attempt: 4,
        createdAt: '2026-05-19T10:05:00.000Z',
      },
    ]);

    renderDetail();
    await screen.findByTestId('storage-migration-failure-doc-deadbeef-uuid');
    expect(
      screen.getByTestId('storage-migration-failure-doc-deadbeef-uuid').textContent,
    ).toMatch(/AccessDenied/);
  });

  // STG-5 ──────────────────────────────────────────────────────────────

  it('Verify button is disabled while the migration is still running', async () => {
    findOneMock.mockResolvedValueOnce(
      buildMigration({ status: 'running' }),
    );
    renderDetail();
    const btn = await screen.findByTestId('storage-migration-verify');
    expect(btn).toBeDisabled();
  });

  it('clicking Verify fires the API once the migration is completed', async () => {
    findOneMock.mockResolvedValueOnce(
      buildMigration({
        status: 'completed',
        migratedCount: 100,
        finishedAt: '2026-05-19T11:00:00.000Z',
      }),
    );
    verifyMock.mockResolvedValueOnce(verification({ status: 'running' }));

    renderDetail();
    const btn = await screen.findByTestId('storage-migration-verify');
    expect(btn).toBeEnabled();
    await userEvent.click(btn);
    await waitFor(() => expect(verifyMock).toHaveBeenCalledTimes(1));
  });

  it('renders the verified-clean result + enables the Delete source button', async () => {
    findOneMock.mockResolvedValue(
      buildMigration({
        status: 'completed',
        migratedCount: 100,
        finishedAt: '2026-05-19T11:00:00.000Z',
      }),
    );
    verificationsMock.mockResolvedValue([verification()]);

    renderDetail();
    const verifyResult = await screen.findByTestId(
      'storage-migration-verify-result',
    );
    expect(verifyResult.textContent).toMatch(/Verified 100 \/ 100/);

    const deleteBtn = await screen.findByTestId(
      'storage-migration-delete-source',
    );
    expect(deleteBtn).toBeEnabled();
  });

  it('blocks Delete source when the verify pass reported gaps', async () => {
    findOneMock.mockResolvedValue(
      buildMigration({
        status: 'completed',
        migratedCount: 100,
        finishedAt: '2026-05-19T11:00:00.000Z',
      }),
    );
    verificationsMock.mockResolvedValue([
      verification({
        status: 'completed_with_gaps',
        verifiedCount: 99,
        missingAtDestination: 1,
        totalChecked: 100,
      }),
    ]);

    renderDetail();
    const verifyResult = await screen.findByTestId(
      'storage-migration-verify-result',
    );
    expect(verifyResult.textContent).toMatch(/Gaps: 1 missing/);

    const deleteBtn = await screen.findByTestId(
      'storage-migration-delete-source',
    );
    expect(deleteBtn).toBeDisabled();
    expect(
      await screen.findByTestId('storage-migration-delete-blocked'),
    ).toBeInTheDocument();
  });

  it('Delete source modal gates Submit on the typed phrase matching exactly', async () => {
    findOneMock.mockResolvedValue(
      buildMigration({
        status: 'completed',
        migratedCount: 42,
        finishedAt: '2026-05-19T11:00:00.000Z',
      }),
    );
    verificationsMock.mockResolvedValue([
      verification({
        verifiedCount: 42,
        totalChecked: 42,
      }),
    ]);
    deleteSourceMock.mockResolvedValueOnce(
      buildMigration({
        sourceDeletedAt: '2026-05-19T11:01:00.000Z',
      }),
    );

    renderDetail();
    const deleteBtn = await screen.findByTestId(
      'storage-migration-delete-source',
    );
    await userEvent.click(deleteBtn);

    const modal = await screen.findByTestId(
      'storage-delete-source-confirm',
    );
    const expected = (
      await screen.findByTestId('storage-delete-expected')
    ).textContent;
    expect(expected).toBe('DELETE 42 documents from spaces-default');

    const input = screen.getByTestId(
      'storage-delete-source-input',
    ) as HTMLInputElement;
    const submit = screen.getByTestId('storage-delete-source-submit');
    expect(submit).toBeDisabled();

    // Wrong phrase keeps it disabled.
    await userEvent.type(input, 'DELETE 41 documents from spaces-default');
    expect(submit).toBeDisabled();

    // Correct phrase enables Submit.
    await userEvent.clear(input);
    await userEvent.type(input, expected as string);
    expect(submit).toBeEnabled();
    await userEvent.click(submit);

    await waitFor(() =>
      expect(deleteSourceMock).toHaveBeenCalledWith('mig-1', expected),
    );
    expect(modal).not.toBeInTheDocument();
  });

  it('shows a "Source already deleted" pill when sourceDeletedAt is set', async () => {
    findOneMock.mockResolvedValue(
      buildMigration({
        status: 'completed',
        migratedCount: 5,
        sourceDeletedAt: '2026-05-19T12:00:00.000Z',
      }),
    );
    verificationsMock.mockResolvedValue([verification()]);

    renderDetail();
    await screen.findByTestId('storage-migration-source-deleted');
    expect(
      screen.getByTestId('storage-migration-delete-source'),
    ).toBeDisabled();
  });
});
