import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, DollarSign, Package, Truck, ShieldCheck } from 'lucide-react';
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
  insuranceFeeFixed: nonNeg.refine((v) => v >= 0, {
    message: 'Must be 0 or greater',
  }),
  insuranceFeePercent: nonNeg.refine((v) => v >= 0 && v <= 100, {
    message: 'Must be between 0 and 100',
  }),
});

type PriceSettingsFormData = z.infer<typeof priceSettingsSchema>;

const PRICE_DEFAULTS: PriceSettingsFormData = {
  baseFare: 0,
  perKmRate: 0,
  smallPackageMultiplier: 0,
  mediumPackageMultiplier: 0,
  largePackageMultiplier: 0,
  insuranceFeeFixed: 0,
  insuranceFeePercent: 0,
};

const driverSettingsSchema = z
  .object({
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
    // Per-order platform charge. Mode selects which inputs apply.
    driverChargeMode: z.enum(['flat', 'percentage']),
    driverChargeFlat: nonNeg.refine((v) => v >= 0, {
      message: 'Must be 0 or greater',
    }),
    driverChargePercentage: nonNeg.refine((v) => v >= 0 && v <= 100, {
      message: 'Must be between 0 and 100',
    }),
    driverChargeCap: nonNeg.refine((v) => v >= 0, {
      message: 'Must be 0 or greater',
    }),
  })
  .superRefine((data, ctx) => {
    // Require a meaningful value for the active mode.
    if (data.driverChargeMode === 'flat' && data.driverChargeFlat <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['driverChargeFlat'],
        message: 'Enter a flat charge greater than 0',
      });
    }
    if (
      data.driverChargeMode === 'percentage' &&
      data.driverChargePercentage <= 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['driverChargePercentage'],
        message: 'Enter a percentage greater than 0',
      });
    }
  });

type DriverSettingsFormData = z.infer<typeof driverSettingsSchema>;

const DRIVER_DEFAULTS: DriverSettingsFormData = {
  driverMinBalance: 0,
  orderDeliveryRadiusKm: 1,
  driverCommissionPct: 15,
  driverChargeMode: 'flat',
  driverChargeFlat: 0,
  driverChargePercentage: 0,
  driverChargeCap: 0,
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
        insuranceFeeFixed: settings.insuranceFeeFixed,
        insuranceFeePercent: settings.insuranceFeePercent,
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

  // useWatch (vs driverForm.watch) so the React Compiler can memoize this
  // component — watch() returns a fresh function each render.
  const chargeMode = useWatch({
    control: driverForm.control,
    name: 'driverChargeMode',
  });

  useEffect(() => {
    if (driverSettings) {
      driverForm.reset({
        driverMinBalance: driverSettings.driverMinBalance,
        orderDeliveryRadiusKm: driverSettings.orderDeliveryRadiusKm,
        driverCommissionPct: driverSettings.driverCommissionPct,
        driverChargeMode: driverSettings.driverChargeMode ?? 'flat',
        driverChargeFlat: driverSettings.driverChargeFlat ?? 0,
        driverChargePercentage: driverSettings.driverChargePercentage ?? 0,
        driverChargeCap: driverSettings.driverChargeCap ?? 0,
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

          {/* Rider insurance fee */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Rider Insurance Fee
              </CardTitle>
              <CardDescription>
                Per-delivery insurance fee debited from the rider's wallet at
                settlement. Percent takes precedence when &gt; 0, otherwise the
                fixed amount applies. Leave both at 0 to disable.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="insuranceFeeFixed">Fixed Amount (₦)</Label>
                  <Input
                    id="insuranceFeeFixed"
                    type="number"
                    step="1"
                    min="0"
                    {...priceForm.register('insuranceFeeFixed', {
                      valueAsNumber: true,
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Flat fee per completed delivery.
                  </p>
                  {priceErrors.insuranceFeeFixed && (
                    <p className="text-sm text-red-500">
                      {priceErrors.insuranceFeeFixed.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insuranceFeePercent">Percent of Order (%)</Label>
                  <Input
                    id="insuranceFeePercent"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...priceForm.register('insuranceFeePercent', {
                      valueAsNumber: true,
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Percentage of estimated order price. Wins over fixed when &gt; 0.
                  </p>
                  {priceErrors.insuranceFeePercent && (
                    <p className="text-sm text-red-500">
                      {priceErrors.insuranceFeePercent.message}
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

              <div className="space-y-4 border-t pt-4">
                <div className="space-y-1">
                  <Label htmlFor="driverChargeMode">
                    Per-order charge (held from driver wallet on accept)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Customers pay the driver in cash; the platform deducts
                    this charge from the driver&apos;s prepaid balance when
                    they accept an order. Drivers below an order&apos;s charge
                    can&apos;t see or accept it.
                  </p>
                  <select
                    id="driverChargeMode"
                    data-testid="driver-charge-mode-select"
                    className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    {...driverForm.register('driverChargeMode')}
                  >
                    <option value="flat">Flat amount (₦)</option>
                    <option value="percentage">
                      Percentage of order price (with cap)
                    </option>
                  </select>
                </div>

                {chargeMode === 'flat' ? (
                  <div className="space-y-2">
                    <Label htmlFor="driverChargeFlat">Flat charge (₦)</Label>
                    <Input
                      id="driverChargeFlat"
                      data-testid="driver-charge-flat-input"
                      type="number"
                      step="1"
                      min="0"
                      {...driverForm.register('driverChargeFlat', {
                        valueAsNumber: true,
                      })}
                    />
                    {driverForm.formState.errors.driverChargeFlat && (
                      <p
                        data-testid="driver-charge-flat-error"
                        className="text-xs text-red-600"
                      >
                        {driverForm.formState.errors.driverChargeFlat.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="driverChargePercentage">
                        Charge percentage (%)
                      </Label>
                      <Input
                        id="driverChargePercentage"
                        data-testid="driver-charge-percentage-input"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        {...driverForm.register('driverChargePercentage', {
                          valueAsNumber: true,
                        })}
                      />
                      {driverForm.formState.errors.driverChargePercentage && (
                        <p
                          data-testid="driver-charge-percentage-error"
                          className="text-xs text-red-600"
                        >
                          {
                            driverForm.formState.errors.driverChargePercentage
                              .message
                          }
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driverChargeCap">Charge cap (₦)</Label>
                      <Input
                        id="driverChargeCap"
                        data-testid="driver-charge-cap-input"
                        type="number"
                        step="1"
                        min="0"
                        {...driverForm.register('driverChargeCap', {
                          valueAsNumber: true,
                        })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum charge per order. 0 = no cap.
                      </p>
                      {driverForm.formState.errors.driverChargeCap && (
                        <p
                          data-testid="driver-charge-cap-error"
                          className="text-xs text-red-600"
                        >
                          {driverForm.formState.errors.driverChargeCap.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
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
