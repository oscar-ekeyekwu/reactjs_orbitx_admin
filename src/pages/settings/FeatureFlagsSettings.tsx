import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ToggleLeft } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Breadcrumb,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '@/components/ui';
import {
  featureFlagsApi,
  type FeatureFlags,
  type VehicleEditGraceMode,
} from '@/services/api';
import { FeatureToggle } from './feature-flags/FeatureToggle';
import { GraceModeOption } from './feature-flags/GraceModeOption';

export function FeatureFlagsSettingsPage() {
  const queryClient = useQueryClient();

  const { data: flags, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: featureFlagsApi.get,
  });

  const mutation = useMutation({
    mutationFn: featureFlagsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
  });

  const toggle = (key: keyof FeatureFlags) => {
    if (!flags) return;
    mutation.mutate({ [key]: !flags[key] } as Partial<FeatureFlags>);
  };

  const setGraceMode = (mode: VehicleEditGraceMode) => {
    if (!flags) return;
    if (flags.vehicleEditGraceMode === mode) return;
    mutation.mutate({ vehicleEditGraceMode: mode });
  };

  return (
    <div>
      <Header
        title="Feature Flags"
        subtitle="Toggle product features without releasing a new app build"
      />

      <div className="p-6">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: 'Settings', href: '/settings' },
            { label: 'Feature Flags' },
          ]}
        />

        <div className="max-w-3xl space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ToggleLeft className="h-5 w-5" />
                    Customer Tracking
                  </CardTitle>
                  <CardDescription>
                    Controls visible to customers tracking an active order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FeatureToggle
                    id="useMapView"
                    label="Show map on customer tracking screen"
                    description="When off, customers see a timeline-only fallback (no Google Maps SDK calls). Use this to disable map billing without a mobile release."
                    checked={flags?.useMapView ?? true}
                    pending={mutation.isPending}
                    error={mutation.isError}
                    success={mutation.isSuccess}
                    onToggle={() => toggle('useMapView')}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Vehicle edit grace mode
                  </CardTitle>
                  <CardDescription>
                    What happens to an approved vehicle while a regulatory edit
                    is awaiting admin review. Switching tightens or loosens
                    trust policy without a code deploy.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <fieldset
                    data-testid="vehicle-grace-mode-fieldset"
                    className="space-y-3"
                    aria-describedby="vehicle-grace-mode-help"
                  >
                    <GraceModeOption
                      id="vehicle-grace-mode-continue"
                      value="continue"
                      label="Continue (lenient)"
                      description="Driver keeps accepting orders against the already-approved vehicle while the edit is reviewed."
                      checked={flags?.vehicleEditGraceMode === 'continue'}
                      disabled={mutation.isPending}
                      onChange={() => setGraceMode('continue')}
                    />
                    <GraceModeOption
                      id="vehicle-grace-mode-lock"
                      value="lock"
                      label="Lock (strict)"
                      description="Driver cannot accept orders until the admin signs off on the change. Surfaces VEHICLE_002 on the mobile client."
                      checked={flags?.vehicleEditGraceMode === 'lock'}
                      disabled={mutation.isPending}
                      onChange={() => setGraceMode('lock')}
                    />
                    {mutation.isSuccess && (
                      <p
                        data-testid="vehicle-grace-mode-success"
                        className="text-xs text-green-600"
                      >
                        Saved
                      </p>
                    )}
                    {mutation.isError && (
                      <p
                        data-testid="vehicle-grace-mode-error"
                        className="text-xs text-red-500"
                      >
                        Could not save. Please try again.
                      </p>
                    )}
                  </fieldset>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
