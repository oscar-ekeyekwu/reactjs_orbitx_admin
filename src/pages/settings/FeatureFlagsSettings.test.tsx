import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Hoisted so the mock factory below sees the same references that the
// tests interact with — vitest moves vi.mock calls to the top of the
// module, before plain `const` declarations.
const { getMock, updateMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock('@/services/api', async () => {
  const actual = await vi.importActual<typeof import('@/services/api')>(
    '@/services/api',
  );
  return {
    ...actual,
    featureFlagsApi: {
      get: getMock,
      update: updateMock,
    },
  };
});

import { FeatureFlagsSettingsPage } from './FeatureFlagsSettings';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <FeatureFlagsSettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('FeatureFlagsSettingsPage — vehicle grace mode radio (F3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMock.mockResolvedValue({
      useMapView: true,
      vehicleEditGraceMode: 'continue',
    });
  });

  it('renders both Continue and Lock options', async () => {
    getMock.mockResolvedValue({
      useMapView: true,
      vehicleEditGraceMode: 'continue',
    });
    renderPage();
    await waitFor(() =>
      expect(
        screen.getByTestId('vehicle-grace-mode-fieldset'),
      ).toBeInTheDocument(),
    );

    expect(screen.getByLabelText(/Continue \(lenient\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lock \(strict\)/i)).toBeInTheDocument();
  });

  it('selects Continue when the server says continue', async () => {
    getMock.mockResolvedValue({
      useMapView: true,
      vehicleEditGraceMode: 'continue',
    });
    renderPage();
    await waitFor(() =>
      expect(
        screen.getByTestId('vehicle-grace-mode-fieldset'),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getByLabelText(/Continue \(lenient\)/i),
    ).toBeChecked();
    expect(screen.getByLabelText(/Lock \(strict\)/i)).not.toBeChecked();
  });

  it('selects Lock when the server says lock', async () => {
    getMock.mockResolvedValue({
      useMapView: true,
      vehicleEditGraceMode: 'lock',
    });
    renderPage();
    await waitFor(() =>
      expect(
        screen.getByTestId('vehicle-grace-mode-fieldset'),
      ).toBeInTheDocument(),
    );

    expect(screen.getByLabelText(/Lock \(strict\)/i)).toBeChecked();
  });

  it('PUTs the new mode when the user picks the other option', async () => {
    getMock.mockResolvedValue({
      useMapView: true,
      vehicleEditGraceMode: 'continue',
    });
    renderPage();
    await waitFor(() =>
      expect(
        screen.getByTestId('vehicle-grace-mode-fieldset'),
      ).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByLabelText(/Lock \(strict\)/i));

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalled(),
    );
    // React Query passes a context object as the 2nd arg; we only care
    // about the patch payload.
    expect(updateMock.mock.calls[0][0]).toEqual({
      vehicleEditGraceMode: 'lock',
    });
  });

  it('does NOT PUT when the user clicks the already-selected option', async () => {
    getMock.mockResolvedValue({
      useMapView: true,
      vehicleEditGraceMode: 'continue',
    });
    renderPage();
    await waitFor(() =>
      expect(
        screen.getByTestId('vehicle-grace-mode-fieldset'),
      ).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByLabelText(/Continue \(lenient\)/i));

    // No mutation fired — saves a roundtrip + avoids "Saved" flash for a no-op.
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('shows the saved confirmation once the mutation settles', async () => {
    getMock.mockResolvedValue({
      useMapView: true,
      vehicleEditGraceMode: 'continue',
    });
    renderPage();
    await waitFor(() =>
      expect(
        screen.getByTestId('vehicle-grace-mode-fieldset'),
      ).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByLabelText(/Lock \(strict\)/i));

    await waitFor(() =>
      expect(
        screen.getByTestId('vehicle-grace-mode-success'),
      ).toBeInTheDocument(),
    );
  });
});
