import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck, ToggleLeft } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Spinner,
} from '@/components/ui';
import {
  featureFlagsApi,
  type FeatureFlags,
  type VehicleEditGraceMode,
} from '@/services/api';

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
        <Link
          to="/settings"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

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

interface FeatureToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  pending: boolean;
  error: boolean;
  success: boolean;
  onToggle: () => void;
}

function FeatureToggle({
  id,
  label,
  description,
  checked,
  pending,
  error,
  success,
  onToggle,
}: FeatureToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="space-y-1">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
        {success && <p className="text-xs text-green-600">Saved</p>}
        {error && (
          <p className="text-xs text-red-500">
            Could not save. Please try again.
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`Toggle ${label}`}
        onClick={onToggle}
        disabled={pending}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          checked ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

interface GraceModeOptionProps {
  id: string;
  value: VehicleEditGraceMode;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}

function GraceModeOption({
  id,
  value,
  label,
  description,
  checked,
  disabled,
  onChange,
}: GraceModeOptionProps) {
  return (
    <label
      htmlFor={id}
      data-testid={id}
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
        checked
          ? 'border-primary bg-primary/5'
          : 'border-border hover:bg-muted/50'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <input
        id={id}
        type="radio"
        name="vehicleEditGraceMode"
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-1 h-4 w-4"
      />
      <div className="space-y-0.5">
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}
