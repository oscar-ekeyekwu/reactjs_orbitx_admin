import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ToggleLeft } from 'lucide-react';
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
import { featureFlagsApi, type FeatureFlags } from '@/services/api';

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
    mutation.mutate({ ...flags, [key]: !flags[key] });
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

        <div className="max-w-3xl">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
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
