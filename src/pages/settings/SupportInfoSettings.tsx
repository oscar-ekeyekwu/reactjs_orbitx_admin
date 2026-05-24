import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, MessageSquare, Save } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Spinner,
} from '@/components/ui';
import { supportInfoApi } from '@/services/api';

// Empty defaults are supplied by `DEFAULTS` + `form.reset()`; using
// `.default('')` here would make the schema's INPUT type optional
// (`phone?: string`) while the OUTPUT stays required, which breaks
// react-hook-form's Resolver<TFieldValues> typing under newer
// @hookform/resolvers/zod versions.
const supportInfoSchema = z.object({
  phone: z.string().trim().max(40, 'Keep phone under 40 characters'),
  email: z.union([
    z.string().trim().email('Enter a valid email address'),
    z.literal(''),
  ]),
  whatsapp: z
    .string()
    .trim()
    .max(40, 'Keep WhatsApp number under 40 characters'),
  hours: z.string().trim().max(120, 'Keep hours under 120 characters'),
});

type SupportInfoFormData = z.infer<typeof supportInfoSchema>;

const DEFAULTS: SupportInfoFormData = {
  phone: '',
  email: '',
  whatsapp: '',
  hours: '',
};

export function SupportInfoSettingsPage() {
  const queryClient = useQueryClient();

  const { data: info, isLoading } = useQuery({
    queryKey: ['support-info'],
    queryFn: supportInfoApi.get,
  });

  const mutation = useMutation({
    mutationFn: supportInfoApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-info'] });
    },
  });

  const form = useForm<SupportInfoFormData>({
    resolver: zodResolver(supportInfoSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (info) {
      form.reset({
        phone: info.phone ?? '',
        email: info.email ?? '',
        whatsapp: info.whatsapp ?? '',
        hours: info.hours ?? '',
      });
    }
  }, [info, form]);

  const onSubmit = (data: SupportInfoFormData) => {
    mutation.mutate(data);
  };

  const errors = form.formState.errors;
  const isDirty = form.formState.isDirty;

  return (
    <div>
      <Header
        title="Support Contact Info"
        subtitle="Phone, email, WhatsApp, and hours shown to drivers and customers in the mobile apps"
      />

      <div className="p-6">
        <Link
          to="/settings"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="max-w-3xl space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Public Contact Info
                </CardTitle>
                <CardDescription>
                  These values appear on the customer Contact Us screen and the
                  driver Support screen. Mobile apps fetch them on load — saved
                  changes show up the next time the screen opens.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+234 801 234 5678"
                      {...form.register('phone')}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tapping <em>Call</em> in the apps dials this number.
                    </p>
                    {errors.phone && (
                      <p className="text-xs text-red-500">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="support@orbitx-dispatch.com"
                      {...form.register('email')}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tapping <em>Email</em> opens a draft to this address.
                    </p>
                    {errors.email && (
                      <p className="text-xs text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp number</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="2348012345678"
                      {...form.register('whatsapp')}
                    />
                    <p className="text-xs text-muted-foreground">
                      International format without &quot;+&quot; or spaces.
                      Tapping <em>WhatsApp</em> opens a chat with this number.
                    </p>
                    {errors.whatsapp && (
                      <p className="text-xs text-red-500">
                        {errors.whatsapp.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">Working hours</Label>
                    <Input
                      id="hours"
                      type="text"
                      placeholder="Mon–Fri 8AM–8PM · Sat–Sun 9AM–5PM"
                      {...form.register('hours')}
                    />
                    <p className="text-xs text-muted-foreground">
                      Free-form string. Shown verbatim in the contact card.
                    </p>
                    {errors.hours && (
                      <p className="text-xs text-red-500">
                        {errors.hours.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3">
              {mutation.isError && (
                <p className="text-sm text-red-500">
                  Could not save. Please try again.
                </p>
              )}
              {mutation.isSuccess && !isDirty && (
                <p className="text-sm text-green-600">Saved</p>
              )}
              <Button type="submit" disabled={!isDirty || mutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
