import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, DollarSign, Package, Truck } from 'lucide-react';
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
import { priceSettingsApi, driverSettingsApi } from '@/services/api';

const nonNeg = z
  .number({ message: 'Enter a valid number' })
  .refine((v) => !Number.isNaN(v), { message: 'Enter a valid number' });

const priceSettingsSchema = z.object({
  baseFare: nonNeg.refine((v) => v >= 0, { message: 'Must be 0 or greater' }),
  perKmRate: nonNeg.refine((v) => v >= 0, { message: 'Must be 0 or greater' }),
  smallPackageMultiplier: nonNeg.refine((v) => v >= 0, {
    message: 'Must be 0 or greater',
  }),
  mediumPackageMultiplier: nonNeg.refine((v) => v >= 0, {
    message: 'Must be 0 or greater',
  }),
  largePackageMultiplier: nonNeg.refine((v) => v >= 0, {
    message: 'Must be 0 or greater',
  }),
});

type PriceSettingsFormData = z.infer<typeof priceSettingsSchema>;

const PRICE_DEFAULTS: PriceSettingsFormData = {
  baseFare: 0,
  perKmRate: 0,
  smallPackageMultiplier: 0,
  mediumPackageMultiplier: 0,
  largePackageMultiplier: 0,
};

const driverSettingsSchema = z.object({
  driverMinBalance: nonNeg.refine((v) => v >= 0, {
    message: 'Must be 0 or greater',
  }),
  orderDeliveryRadiusKm: nonNeg.refine((v) => v >= 1, {
    message: 'Must be at least 1',
  }),
  // G5 — platform commission percentage. Backend rejects anything
  // outside [0, 100]; the form mirrors the same bounds.
  driverCommissionPct: nonNeg.refine((v) => v >= 0 && v <= 100, {
    message: 'Must be between 0 and 100',
  }),
});

type DriverSettingsFormData = z.infer<typeof driverSettingsSchema>;

const DRIVER_DEFAULTS: DriverSettingsFormData = {
  driverMinBalance: 0,
  orderDeliveryRadiusKm: 1,
  driverCommissionPct: 15,
};

export function PriceSettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['price-settings'],
    queryFn: priceSettingsApi.get,
  });

  const updateMutation = useMutation({
    mutationFn: priceSettingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-settings'] });
    },
  });

  const priceForm = useForm<PriceSettingsFormData>({
    resolver: zodResolver(priceSettingsSchema),
    defaultValues: PRICE_DEFAULTS,
  });

  useEffect(() => {
    if (settings) {
      priceForm.reset({
        baseFare: settings.baseFare,
        perKmRate: settings.perKmRate,
        smallPackageMultiplier: settings.smallPackageMultiplier,
        mediumPackageMultiplier: settings.mediumPackageMultiplier,
        largePackageMultiplier: settings.largePackageMultiplier,
      });
    }
  }, [settings, priceForm]);

  const onSubmit = (data: PriceSettingsFormData) => {
    updateMutation.mutate(data);
  };

  const { data: driverSettings, isLoading: driverLoading } = useQuery({
    queryKey: ['driver-settings'],
    queryFn: driverSettingsApi.get,
  });

  const driverSettingsMutation = useMutation({
    mutationFn: driverSettingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-settings'] });
    },
  });

  const driverForm = useForm<DriverSettingsFormData>({
    resolver: zodResolver(driverSettingsSchema),
    defaultValues: DRIVER_DEFAULTS,
  });

  useEffect(() => {
    if (driverSettings) {
      driverForm.reset({
        driverMinBalance: driverSettings.driverMinBalance,
        orderDeliveryRadiusKm: driverSettings.orderDeliveryRadiusKm,
        driverCommissionPct: driverSettings.driverCommissionPct,
      });
    }
  }, [driverSettings, driverForm]);

  const onSubmitDriverSettings = (data: DriverSettingsFormData) => {
    driverSettingsMutation.mutate(data);
  };

  if (isLoading || driverLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const priceErrors = priceForm.formState.errors;
  const isPriceDirty = priceForm.formState.isDirty;
  const isDriverDirty = driverForm.formState.isDirty;

  return (
    <div>
      <Header
        title="Price Settings"
        subtitle="Configure pricing parameters for deliveries"
      />

      <div className="p-6">
        <form
          onSubmit={priceForm.handleSubmit(onSubmit)}
          className="space-y-6 max-w-3xl"
        >
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="baseFare">Base Fare (₦)</Label>
                  <Input
                    id="baseFare"
                    type="number"
                    step="0.01"
                    {...priceForm.register('baseFare', { valueAsNumber: true })}
                  />
                  {priceErrors.baseFare && (
                    <p className="text-sm text-red-500">
                      {priceErrors.baseFare.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perKmRate">Per Kilometer Rate (₦)</Label>
                  <Input
                    id="perKmRate"
                    type="number"
                    step="0.01"
                    {...priceForm.register('perKmRate', { valueAsNumber: true })}
                  />
                  {priceErrors.perKmRate && (
                    <p className="text-sm text-red-500">
                      {priceErrors.perKmRate.message}
                    </p>
                  )}
                </div>
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="smallPackageMultiplier">Small Package</Label>
                  <Input
                    id="smallPackageMultiplier"
                    type="number"
                    step="0.01"
                    {...priceForm.register('smallPackageMultiplier', {
                      valueAsNumber: true,
                    })}
                  />
                  {priceErrors.smallPackageMultiplier && (
                    <p className="text-sm text-red-500">
                      {priceErrors.smallPackageMultiplier.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mediumPackageMultiplier">Medium Package</Label>
                  <Input
                    id="mediumPackageMultiplier"
                    type="number"
                    step="0.01"
                    {...priceForm.register('mediumPackageMultiplier', {
                      valueAsNumber: true,
                    })}
                  />
                  {priceErrors.mediumPackageMultiplier && (
                    <p className="text-sm text-red-500">
                      {priceErrors.mediumPackageMultiplier.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="largePackageMultiplier">Large Package</Label>
                  <Input
                    id="largePackageMultiplier"
                    type="number"
                    step="0.01"
                    {...priceForm.register('largePackageMultiplier', {
                      valueAsNumber: true,
                    })}
                  />
                  {priceErrors.largePackageMultiplier && (
                    <p className="text-sm text-red-500">
                      {priceErrors.largePackageMultiplier.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            {updateMutation.isSuccess && !isPriceDirty && (
              <p className="text-sm text-green-600">Saved</p>
            )}
            <Button
              type="submit"
              disabled={!isPriceDirty || updateMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>

        {/* Driver & Order Settings */}
        <form
          onSubmit={driverForm.handleSubmit(onSubmitDriverSettings)}
          className="space-y-6 max-w-3xl mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Driver &amp; Order Settings
              </CardTitle>
              <CardDescription>
                Configure minimum driver balance and order delivery radius
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="driverMinBalance">
                    Minimum Balance Required (₦)
                  </Label>
                  <Input
                    id="driverMinBalance"
                    type="number"
                    step="100"
                    min="0"
                    {...driverForm.register('driverMinBalance', {
                      valueAsNumber: true,
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Drivers must hold at least this balance to accept orders
                    (security deposit)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderDeliveryRadiusKm">
                    Order Delivery Radius (km)
                  </Label>
                  <Input
                    id="orderDeliveryRadiusKm"
                    type="number"
                    step="1"
                    min="1"
                    {...driverForm.register('orderDeliveryRadiusKm', {
                      valueAsNumber: true,
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Drivers only see orders within this radius of their location
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverCommissionPct">
                    Platform commission (%)
                  </Label>
                  <Input
                    id="driverCommissionPct"
                    data-testid="driver-commission-pct-input"
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    {...driverForm.register('driverCommissionPct', {
                      valueAsNumber: true,
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cut taken from each completed order. Stored on each
                    transaction at completion time so changes apply only
                    to future settlements (G5).
                  </p>
                  {driverForm.formState.errors.driverCommissionPct && (
                    <p
                      data-testid="driver-commission-pct-error"
                      className="text-xs text-red-600"
                    >
                      {driverForm.formState.errors.driverCommissionPct.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            {driverSettingsMutation.isSuccess && !isDriverDirty && (
              <p className="text-sm text-green-600">Saved</p>
            )}
            <Button
              type="submit"
              disabled={!isDriverDirty || driverSettingsMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {driverSettingsMutation.isPending
                ? 'Saving...'
                : 'Save Driver Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
