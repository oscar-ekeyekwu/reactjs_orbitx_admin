import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useThemeStore, applyTheme } from '@/stores/themeStore';
import {
  LoginPage,
  DashboardPage,
  CustomersPage,
  CustomerDetailPage,
  DriversPage,
  DriverDetailPage,
  OrdersPage,
  OrderDetailPage,
  PriceSettingsPage,
  FAQsPage,
  SupportPage,
  SettingsPage,
  NotificationSettingsPage,
  SecuritySettingsPage,
  AppearanceSettingsPage,
  DataSettingsPage,
  FeatureFlagsSettingsPage,
  StorageSettingsPage,
  StorageMigrationsPage,
  StorageMigrationDetailPage,
  PaymentProvidersPage,
  AuditLogPage,
  CompaniesPage,
  CompanyDetailPage,
  VehiclesPage,
  VehicleDetailPage,
  DocumentsPage,
  DocumentDetailPage,
  IncidentsPage,
  IncidentDetailPage,
  PrivacySettingsPage,
  SupportInfoSettingsPage,
  ApprovalsPage,
  TrackPage,
  TransfersPage,
  PayoutsPage,
} from '@/pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  const mode = useThemeStore((s) => s.mode);
  const accentId = useThemeStore((s) => s.accentId);

  useEffect(() => {
    applyTheme(mode, accentId);
  }, [mode, accentId]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme(mode, accentId);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode, accentId]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          {/* E3 — public read-only order tracking. No auth required;
              the mobile share sheet hands the recipient this URL. */}
          <Route path="/track/:token" element={<TrackPage />} />

          {/* Protected admin routes */}
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/drivers" element={<DriversPage />} />
            <Route path="/drivers/:id" element={<DriverDetailPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/companies/:id" element={<CompanyDetailPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/documents/:id" element={<DocumentDetailPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/incidents/:id" element={<IncidentDetailPage />} />
            <Route
              path="/settings/privacy"
              element={<PrivacySettingsPage />}
            />
            <Route path="/transfers" element={<TransfersPage />} />
            <Route path="/payouts" element={<PayoutsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/price-settings" element={<PriceSettingsPage />} />
            <Route
              path="/settings/pricing"
              element={<Navigate to="/price-settings" replace />}
            />
            <Route path="/faqs" element={<FAQsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route
              path="/settings/notifications"
              element={<NotificationSettingsPage />}
            />
            <Route
              path="/settings/security"
              element={<SecuritySettingsPage />}
            />
            <Route
              path="/settings/appearance"
              element={<AppearanceSettingsPage />}
            />
            <Route path="/settings/data" element={<DataSettingsPage />} />
            <Route
              path="/settings/feature-flags"
              element={<FeatureFlagsSettingsPage />}
            />
            <Route
              path="/settings/storage"
              element={<StorageSettingsPage />}
            />
            <Route
              path="/settings/storage/migrations"
              element={<StorageMigrationsPage />}
            />
            <Route
              path="/settings/storage/migrations/:id"
              element={<StorageMigrationDetailPage />}
            />
            <Route
              path="/settings/payment-providers"
              element={<PaymentProvidersPage />}
            />
            <Route
              path="/settings/support-info"
              element={<SupportInfoSettingsPage />}
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
