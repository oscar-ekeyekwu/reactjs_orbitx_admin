import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, DollarSign, Package, Gauge } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Button,
  Label,
  Spinner,
} from '@/components/ui';
import { priceSettingsApi } from '@/services/api';

const priceSettingsSchema = z.object({
  baseFare: z.string().transform((val) => parseFloat(val) || 0),
  perKmRate: z.string().transform((val) => parseFloat(val) || 0),
  perMinuteRate: z.string().transform((val) => parseFloat(val) || 0),
  minimumFare: z.string().transform((val) => parseFloat(val) || 0),
  surgeFactor: z.string().transform((val) => parseFloat(val) || 1),
  smallPackageMultiplier: z.string().transform((val) => parseFloat(val) || 0),
  mediumPackageMultiplier: z.string().transform((val) => parseFloat(val) || 0),
  largePackageMultiplier: z.string().transform((val) => parseFloat(val) || 0),
});

type PriceSettingsFormData = z.output<typeof priceSettingsSchema>;

export function PriceSettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['price-settings'],
    queryFn: priceSettingsApi.get,
    // Placeholder data if API doesn't exist yet
    placeholderData: {
      id: '1',
      baseFare: 5.0,
      perKmRate: 1.5,
      perMinuteRate: 0.25,
      minimumFare: 8.0,
      surgeFactor: 1.0,
      smallPackageMultiplier: 1.0,
      mediumPackageMultiplier: 1.25,
      largePackageMultiplier: 1.5,
      updatedAt: new Date().toISOString(),
    },
  });

  const updateMutation = useMutation({
    mutationFn: priceSettingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-settings'] });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(priceSettingsSchema),
    values: settings
      ? {
          baseFare: String(settings.baseFare),
          perKmRate: String(settings.perKmRate),
          perMinuteRate: String(settings.perMinuteRate),
          minimumFare: String(settings.minimumFare),
          surgeFactor: String(settings.surgeFactor),
          smallPackageMultiplier: String(settings.smallPackageMultiplier),
          mediumPackageMultiplier: String(settings.mediumPackageMultiplier),
          largePackageMultiplier: String(settings.largePackageMultiplier),
        }
      : undefined,
  });

  const onSubmit = (data: PriceSettingsFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Price Settings"
        subtitle="Configure pricing parameters for deliveries"
      />

      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
          {/* Base Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Base Pricing
              </CardTitle>
              <CardDescription>
                Set the base fare and rate parameters for price calculation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseFare">Base Fare ($)</Label>
                  <Input
                    id="baseFare"
                    type="number"
                    step="0.01"
                    {...register('baseFare')}
                  />
                  {errors.baseFare && (
                    <p className="text-sm text-red-500">{errors.baseFare.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumFare">Minimum Fare ($)</Label>
                  <Input
                    id="minimumFare"
                    type="number"
                    step="0.01"
                    {...register('minimumFare')}
                  />
                  {errors.minimumFare && (
                    <p className="text-sm text-red-500">{errors.minimumFare.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="perKmRate">Per Kilometer Rate ($)</Label>
                  <Input
                    id="perKmRate"
                    type="number"
                    step="0.01"
                    {...register('perKmRate')}
                  />
                  {errors.perKmRate && (
                    <p className="text-sm text-red-500">{errors.perKmRate.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perMinuteRate">Per Minute Rate ($)</Label>
                  <Input
                    id="perMinuteRate"
                    type="number"
                    step="0.01"
                    {...register('perMinuteRate')}
                  />
                  {errors.perMinuteRate && (
                    <p className="text-sm text-red-500">{errors.perMinuteRate.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Surge Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Surge Pricing
              </CardTitle>
              <CardDescription>
                Configure surge multiplier for high-demand periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs space-y-2">
                <Label htmlFor="surgeFactor">Surge Factor (1.0 = no surge)</Label>
                <Input
                  id="surgeFactor"
                  type="number"
                  step="0.1"
                  min="1"
                  {...register('surgeFactor')}
                />
                {errors.surgeFactor && (
                  <p className="text-sm text-red-500">{errors.surgeFactor.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Package Size Multipliers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Package Size Multipliers
              </CardTitle>
              <CardDescription>
                Set price multipliers based on package size
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smallPackageMultiplier">Small Package</Label>
                  <Input
                    id="smallPackageMultiplier"
                    type="number"
                    step="0.01"
                    {...register('smallPackageMultiplier')}
                  />
                  {errors.smallPackageMultiplier && (
                    <p className="text-sm text-red-500">
                      {errors.smallPackageMultiplier.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mediumPackageMultiplier">Medium Package</Label>
                  <Input
                    id="mediumPackageMultiplier"
                    type="number"
                    step="0.01"
                    {...register('mediumPackageMultiplier')}
                  />
                  {errors.mediumPackageMultiplier && (
                    <p className="text-sm text-red-500">
                      {errors.mediumPackageMultiplier.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="largePackageMultiplier">Large Package</Label>
                  <Input
                    id="largePackageMultiplier"
                    type="number"
                    step="0.01"
                    {...register('largePackageMultiplier')}
                  />
                  {errors.largePackageMultiplier && (
                    <p className="text-sm text-red-500">
                      {errors.largePackageMultiplier.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
