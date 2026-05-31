import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { priceGetMock, driverGetMock, driverUpdateMock } = vi.hoisted(() => ({
  priceGetMock: vi.fn(),
  driverGetMock: vi.fn(),
  driverUpdateMock: vi.fn(),
}));

vi.mock('@/services/api', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/api')>('@/services/api');
  return {
    ...actual,
    priceSettingsApi: { get: priceGetMock, update: vi.fn() },
    driverSettingsApi: { get: driverGetMock, update: driverUpdateMock },
  };
});

import { PriceSettingsPage } from './PriceSettings';

const PRICE = {
  baseFare: 1000,
  perKmRate: 100,
  smallPackageMultiplier: 1,
  mediumPackageMultiplier: 1.5,
  largePackageMultiplier: 2,
  insuranceFeeFixed: 0,
  insuranceFeePercent: 0,
};

function driverSettings(overrides = {}) {
  return {
    driverMinBalance: 5000,
    orderDeliveryRadiusKm: 50,
    driverCommissionPct: 15,
    driverChargeMode: 'flat' as const,
    driverChargeFlat: 200,
    driverChargePercentage: 10,
    driverChargeCap: 0,
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PriceSettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PriceSettingsPage — per-order driver charge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    priceGetMock.mockResolvedValue(PRICE);
    driverUpdateMock.mockResolvedValue(driverSettings());
  });

  it('renders the flat input and hides percentage/cap in flat mode', async () => {
    driverGetMock.mockResolvedValue(driverSettings({ driverChargeMode: 'flat' }));
    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId('driver-charge-flat-input')).toBeInTheDocument(),
    );
    expect(
      screen.queryByTestId('driver-charge-percentage-input'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('driver-charge-cap-input'),
    ).not.toBeInTheDocument();
  });

  it('shows percentage + cap and hides flat when mode is percentage', async () => {
    driverGetMock.mockResolvedValue(
      driverSettings({ driverChargeMode: 'percentage' }),
    );
    renderPage();

    await waitFor(() =>
      expect(
        screen.getByTestId('driver-charge-percentage-input'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByTestId('driver-charge-cap-input')).toBeInTheDocument();
    expect(
      screen.queryByTestId('driver-charge-flat-input'),
    ).not.toBeInTheDocument();
  });

  it('switches fields when the mode select changes', async () => {
    driverGetMock.mockResolvedValue(driverSettings({ driverChargeMode: 'flat' }));
    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId('driver-charge-flat-input')).toBeInTheDocument(),
    );

    await userEvent.selectOptions(
      screen.getByTestId('driver-charge-mode-select'),
      'percentage',
    );

    expect(
      screen.getByTestId('driver-charge-percentage-input'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('driver-charge-flat-input'),
    ).not.toBeInTheDocument();
  });

  it('blocks the save when percentage exceeds 100', async () => {
    driverGetMock.mockResolvedValue(
      driverSettings({
        driverChargeMode: 'percentage',
        driverChargePercentage: 10,
      }),
    );
    renderPage();

    const pctInput = await screen.findByTestId(
      'driver-charge-percentage-input',
    );
    await userEvent.clear(pctInput);
    await userEvent.type(pctInput, '150');
    await userEvent.click(
      screen.getByRole('button', { name: /Save Driver Settings/i }),
    );

    // Zod refine (0–100) blocks the submit — the mutation never fires.
    await new Promise((r) => setTimeout(r, 200));
    expect(driverUpdateMock).not.toHaveBeenCalled();
  });

  it('allows the save when percentage is within range', async () => {
    driverGetMock.mockResolvedValue(
      driverSettings({
        driverChargeMode: 'percentage',
        driverChargePercentage: 10,
      }),
    );
    renderPage();

    const pctInput = await screen.findByTestId(
      'driver-charge-percentage-input',
    );
    await userEvent.clear(pctInput);
    await userEvent.type(pctInput, '20');
    await userEvent.click(
      screen.getByRole('button', { name: /Save Driver Settings/i }),
    );

    await waitFor(() => expect(driverUpdateMock).toHaveBeenCalled());
    expect(driverUpdateMock.mock.calls[0][0]).toMatchObject({
      driverChargeMode: 'percentage',
      driverChargePercentage: 20,
    });
  });

  it('submits the charge fields when valid', async () => {
    driverGetMock.mockResolvedValue(driverSettings({ driverChargeMode: 'flat' }));
    renderPage();

    const flatInput = await screen.findByTestId('driver-charge-flat-input');
    await userEvent.clear(flatInput);
    await userEvent.type(flatInput, '300');
    await userEvent.click(
      screen.getByRole('button', { name: /Save Driver Settings/i }),
    );

    await waitFor(() => expect(driverUpdateMock).toHaveBeenCalled());
    expect(driverUpdateMock.mock.calls[0][0]).toMatchObject({
      driverChargeMode: 'flat',
      driverChargeFlat: 300,
    });
  });
});
