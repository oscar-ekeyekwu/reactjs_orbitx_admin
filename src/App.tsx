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
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
