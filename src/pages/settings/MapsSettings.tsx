import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Map, Save, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Breadcrumb,
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
import { mapsSettingsApi } from '@/services/api';

/**
 * Admin page to set + rotate the Google Maps Platform API key used by
 * the backend maps proxy (POST /maps/...). The key is stored in
 * system_configs; mobile clients never see the plaintext — they call
 * the proxy and the backend forwards to Google.
 *
 * On read the backend returns only a mask (`•••AIza`); on save we
 * send the new plaintext. No client-side persistence of the key
 * itself.
 */
export function MapsSettingsPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [show, setShow] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['maps-settings'],
    queryFn: mapsSettingsApi.get,
  });

  const updateMutation = useMutation({
    mutationFn: mapsSettingsApi.update,
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['maps-settings'] });
    },
  });

  const onSave = () => {
    if (!draft.trim()) return;
    updateMutation.mutate({ apiKey: draft.trim() });
  };

  return (
    <div>
      <Header
        title="Maps API Key"
        subtitle="Google Maps Platform key used by the autocomplete + geocoding proxy"
      />

      <div className="p-4 md:p-6">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: 'Settings', href: '/settings' },
            { label: 'Maps API Key' },
          ]}
        />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Current key
                </CardTitle>
                <CardDescription>
                  The mobile apps call your backend; your backend calls
                  Google with this key. Rotate any time — no APK rebuild
                  required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {settings?.configured ? (
                  <div className="space-y-1">
                    <Label>Active</Label>
                    <p className="font-mono text-sm tracking-widest">
                      {settings.maskedKey}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-semibold">Not configured</p>
                      <p className="text-xs">
                        Without a key, customer address autocomplete +
                        geocoding will return 503. Paste a Google Maps
                        Platform key below to enable.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {settings?.configured ? 'Rotate key' : 'Set key'}
                </CardTitle>
                <CardDescription>
                  Paste a Google Maps Platform API key. Make sure
                  Places API + Geocoding API are enabled and your
                  billing project has quota.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maps-api-key">New key</Label>
                  <div className="relative">
                    <Input
                      id="maps-api-key"
                      type={show ? 'text' : 'password'}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="AIzaSy…"
                      autoComplete="off"
                      className="pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-label={show ? 'Hide key' : 'Show key'}
                    >
                      {show ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Restrict the key in Google Cloud to HTTP-referrer or
                    IP allowlists for your backend so it can't be abused
                    if leaked.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3">
                  {updateMutation.isSuccess && (
                    <p className="text-sm text-green-600">Saved</p>
                  )}
                  {updateMutation.isError && (
                    <p className="text-sm text-red-500">
                      Could not save. Try again.
                    </p>
                  )}
                  <Button
                    type="button"
                    onClick={onSave}
                    disabled={!draft.trim() || updateMutation.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateMutation.isPending ? 'Saving…' : 'Save key'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
