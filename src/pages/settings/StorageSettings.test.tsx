import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { listMock, createMock, updateMock, testMock, activateMock, removeMock } =
  vi.hoisted(() => ({
    listMock: vi.fn(),
    createMock: vi.fn(),
    updateMock: vi.fn(),
    testMock: vi.fn(),
    activateMock: vi.fn(),
    removeMock: vi.fn(),
  }));

vi.mock('@/services/api', async () => {
  const actual = await vi.importActual<typeof import('@/services/api')>(
    '@/services/api',
  );
  return {
    ...actual,
    storageProvidersApi: {
      list: listMock,
      create: createMock,
      update: updateMock,
      test: testMock,
      activate: activateMock,
      remove: removeMock,
    },
  };
});

import { StorageSettingsPage } from './StorageSettings';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <StorageSettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function provider(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prov-1',
    slug: 'spaces-default',
    kind: 's3_compatible' as const,
    displayName: 'DigitalOcean Spaces',
    endpoint: 'https://nyc3.digitaloceanspaces.com',
    region: 'nyc3',
    bucket: 'orbit-kyc-v1',
    accessKeyId: 'AKIA-EXAMPLE',
    secretAccessKey: {
      masked: '••••••1234',
      updatedAt: '2026-05-19T00:00:00.000Z',
    },
    enabled: true,
    isActive: true,
    createdAt: '2026-05-19T00:00:00.000Z',
    updatedAt: '2026-05-19T00:00:00.000Z',
    ...overrides,
  };
}

describe('StorageSettingsPage (STG-2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders each provider with the masked secret (never the plaintext)', async () => {
    listMock.mockResolvedValueOnce([
      provider(),
      provider({
        id: 'prov-2',
        slug: 'supabase-eu',
        displayName: 'Supabase EU',
        isActive: false,
      }),
    ]);

    renderPage();

    await waitFor(() =>
      expect(
        screen.getByTestId('storage-provider-row-spaces-default'),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getByTestId('storage-masked-secret-spaces-default').textContent,
    ).toBe('••••••1234');
    expect(
      screen.getByTestId('storage-active-badge-spaces-default'),
    ).toBeInTheDocument();
    // The non-active provider has no Active badge.
    expect(
      screen.queryByTestId('storage-active-badge-supabase-eu'),
    ).not.toBeInTheDocument();
  });

  it('opens the Add modal with empty fields and POSTs on submit', async () => {
    listMock.mockResolvedValue([]);
    createMock.mockResolvedValueOnce(provider());

    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId('storage-add-provider')).toBeEnabled(),
    );

    await userEvent.click(screen.getByTestId('storage-add-provider'));
    await waitFor(() =>
      expect(screen.getByTestId('storage-editor-form')).toBeInTheDocument(),
    );

    await userEvent.type(
      screen.getByTestId('storage-form-slug'),
      'supabase-eu',
    );
    await userEvent.type(
      screen.getByTestId('storage-form-displayName'),
      'Supabase EU',
    );
    await userEvent.type(
      screen.getByTestId('storage-form-endpoint'),
      'https://abc.supabase.co/storage/v1/s3',
    );
    await userEvent.type(
      screen.getByTestId('storage-form-region'),
      'eu-central-1',
    );
    await userEvent.type(screen.getByTestId('storage-form-bucket'), 'kyc-v1');
    await userEvent.type(
      screen.getByTestId('storage-form-accessKeyId'),
      'AKIA-NEW',
    );
    await userEvent.type(
      screen.getByTestId('storage-form-secretAccessKey'),
      'plaintext-secret-12345',
    );

    await userEvent.click(screen.getByTestId('storage-form-submit'));

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock).toHaveBeenCalledWith({
      slug: 'supabase-eu',
      displayName: 'Supabase EU',
      endpoint: 'https://abc.supabase.co/storage/v1/s3',
      region: 'eu-central-1',
      bucket: 'kyc-v1',
      accessKeyId: 'AKIA-NEW',
      secretAccessKey: 'plaintext-secret-12345',
    });
  });

  it('opens the Edit modal pre-populated, with slug disabled, and PATCHes without secret when blank', async () => {
    listMock.mockResolvedValue([provider({ isActive: false })]);
    updateMock.mockResolvedValueOnce(provider());

    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId('storage-edit-spaces-default')).toBeEnabled(),
    );
    await userEvent.click(screen.getByTestId('storage-edit-spaces-default'));

    const slugInput = screen.getByTestId('storage-form-slug');
    expect(slugInput).toBeDisabled();
    expect((slugInput as HTMLInputElement).value).toBe('spaces-default');

    const displayInput = screen.getByTestId(
      'storage-form-displayName',
    ) as HTMLInputElement;
    await userEvent.clear(displayInput);
    await userEvent.type(displayInput, 'Spaces (Renamed)');

    await userEvent.click(screen.getByTestId('storage-form-submit'));

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    const [, payload] = updateMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(payload).toEqual(
      expect.objectContaining({ displayName: 'Spaces (Renamed)' }),
    );
    // Secret is omitted from the PATCH when the field stays blank.
    expect(payload).not.toHaveProperty('secretAccessKey');
  });

  it('Test button shows pass with latency on success and fail message on failure', async () => {
    listMock.mockResolvedValue([provider({ isActive: false })]);
    testMock.mockResolvedValueOnce({ ok: true, latencyMs: 137 });

    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId('storage-test-spaces-default')).toBeEnabled(),
    );
    await userEvent.click(screen.getByTestId('storage-test-spaces-default'));

    const result = await screen.findByTestId(
      'storage-test-result-spaces-default',
    );
    expect(result.textContent).toMatch(/Test passed/);
    expect(result.textContent).toMatch(/137 ms/);

    // Second test, this time failing.
    testMock.mockResolvedValueOnce({
      ok: false,
      error: 'AccessDenied (403): invalid signature',
    });
    await userEvent.click(screen.getByTestId('storage-test-spaces-default'));
    await waitFor(() =>
      expect(
        screen.getByTestId('storage-test-result-spaces-default').textContent,
      ).toMatch(/Test failed/),
    );
  });

  it('asks for confirmation when activating a provider that has not been tested', async () => {
    listMock.mockResolvedValue([
      provider({ isActive: true }),
      provider({
        id: 'prov-2',
        slug: 'supabase-eu',
        displayName: 'Supabase EU',
        isActive: false,
      }),
    ]);
    activateMock.mockResolvedValueOnce(
      provider({
        id: 'prov-2',
        slug: 'supabase-eu',
        displayName: 'Supabase EU',
        isActive: true,
      }),
    );

    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId('storage-activate-supabase-eu')).toBeEnabled(),
    );
    await userEvent.click(screen.getByTestId('storage-activate-supabase-eu'));

    // Confirmation modal appears because we haven't tested yet.
    const modal = await screen.findByTestId('storage-activate-confirm');
    expect(modal).toBeInTheDocument();
    // No API call yet.
    expect(activateMock).not.toHaveBeenCalled();

    await userEvent.click(
      within(modal).getByTestId('storage-activate-confirm-submit'),
    );
    await waitFor(() => expect(activateMock).toHaveBeenCalledWith('prov-2'));
  });

  it('activates without confirmation after a successful Test', async () => {
    listMock.mockResolvedValue([
      provider({ isActive: true }),
      provider({
        id: 'prov-2',
        slug: 'supabase-eu',
        displayName: 'Supabase EU',
        isActive: false,
      }),
    ]);
    testMock.mockResolvedValueOnce({ ok: true, latencyMs: 100 });
    activateMock.mockResolvedValueOnce(provider());

    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId('storage-test-supabase-eu')).toBeEnabled(),
    );
    await userEvent.click(screen.getByTestId('storage-test-supabase-eu'));
    await screen.findByTestId('storage-test-result-supabase-eu');

    await userEvent.click(screen.getByTestId('storage-activate-supabase-eu'));

    // No modal — direct activation.
    expect(
      screen.queryByTestId('storage-activate-confirm'),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(activateMock).toHaveBeenCalledWith('prov-2'));
  });

  it('Delete button confirms then calls remove; the active provider has no Delete button', async () => {
    listMock.mockResolvedValueOnce([
      provider({ isActive: true }),
      provider({
        id: 'prov-2',
        slug: 'supabase-eu',
        displayName: 'Supabase EU',
        isActive: false,
      }),
    ]);
    removeMock.mockResolvedValueOnce(undefined);
    listMock.mockResolvedValueOnce([provider({ isActive: true })]);

    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId('storage-delete-supabase-eu')).toBeEnabled(),
    );
    // Active provider has no Delete button rendered.
    expect(
      screen.queryByTestId('storage-delete-spaces-default'),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('storage-delete-supabase-eu'));
    const modal = await screen.findByTestId('storage-delete-confirm');
    await userEvent.click(
      within(modal).getByTestId('storage-delete-confirm-submit'),
    );

    await waitFor(() => expect(removeMock).toHaveBeenCalledWith('prov-2'));
  });
});
