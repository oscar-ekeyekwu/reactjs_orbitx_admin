import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { formatDistanceToNowStrict } from 'date-fns';
import { MapPin, Truck, Package } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Badge,
  Card,
  CardContent,
  EmptyState,
  Spinner,
} from '@/components/ui';
import { liveDriversApi, type LiveDriverRow } from '@/services/api/liveDrivers';
import { mapsSettingsApi } from '@/services/api/maps-settings';

// Lagos is the operational hex for v1, so the map opens centered
// there. Tuned mid-island; admins can pan freely once loaded.
const LAGOS_CENTER = { lat: 6.5244, lng: 3.3792 };

interface SelectedDriver {
  driver: LiveDriverRow;
}

export function LiveDriversPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<SelectedDriver | null>(null);

  // Plaintext Maps key for the JS lib. Cached for an hour; the key
  // doesn't change often and a stale value just means the same map
  // continues to render. Admin auth is required for the endpoint.
  const keyQuery = useQuery({
    queryKey: ['maps-key'],
    queryFn: () => mapsSettingsApi.getKey(),
    staleTime: 60 * 60 * 1000,
  });

  // Live driver snapshot. Poll every 10s while the page is mounted;
  // background-refetch is off so a hidden tab doesn't spam the
  // backend. Stale-while-revalidate keeps the last good frame on
  // screen during a transient network glitch.
  const driversQuery = useQuery({
    queryKey: ['live-drivers'],
    queryFn: liveDriversApi.list,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });

  const drivers = useMemo(
    () => driversQuery.data ?? [],
    [driversQuery.data],
  );
  const withLocation = useMemo(
    () =>
      drivers.filter(
        (d): d is LiveDriverRow & { latitude: number; longitude: number } =>
          d.latitude != null && d.longitude != null,
      ),
    [drivers],
  );

  // Drop the InfoWindow if the selected driver leaves the snapshot
  // (e.g. they went offline since we opened the popup).
  useEffect(() => {
    if (!selected) return;
    const stillThere = drivers.find((d) => d.userId === selected.driver.userId);
    if (!stillThere) setSelected(null);
    else if (stillThere !== selected.driver)
      setSelected({ driver: stillThere });
  }, [drivers, selected]);

  const apiKey = keyQuery.data?.apiKey ?? '';

  return (
    <div>
      <Header
        title="Live Drivers"
        subtitle="Dispatcher view of online drivers and their last reported GPS — auto-refreshes every 10s."
      />

      <div className="p-4 md:p-6">
        {/* Stat strip */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile
            label="Online"
            value={drivers.length}
            icon={<Truck className="h-4 w-4" />}
          />
          <StatTile
            label="On delivery"
            value={drivers.filter((d) => d.isOnDelivery).length}
            icon={<Package className="h-4 w-4" />}
          />
          <StatTile
            label="With GPS"
            value={withLocation.length}
            icon={<MapPin className="h-4 w-4" />}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          {/* Map */}
          <Card className="overflow-hidden">
            <CardContent className="h-[480px] p-0 md:h-[640px]">
              {keyQuery.isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Spinner />
                </div>
              ) : !apiKey ? (
                <div className="flex h-full items-center justify-center p-6">
                  <EmptyState
                    icon={MapPin}
                    title="Google Maps key not set"
                    description="Set the Google Maps API key in Settings → Integrations → Maps API Key to enable the live map."
                  />
                </div>
              ) : (
                <APIProvider apiKey={apiKey}>
                  <Map
                    defaultCenter={LAGOS_CENTER}
                    defaultZoom={11}
                    mapId="orbit-live-drivers"
                    disableDefaultUI={false}
                    style={{ width: '100%', height: '100%' }}
                  >
                    {withLocation.map((d) => (
                      <AdvancedMarker
                        key={d.userId}
                        position={{ lat: d.latitude, lng: d.longitude }}
                        onClick={() => setSelected({ driver: d })}
                      >
                        <Pin
                          background={d.isOnDelivery ? '#f59e0b' : '#61F62A'}
                          borderColor="#000"
                          glyphColor="#000"
                        />
                      </AdvancedMarker>
                    ))}
                    {selected &&
                      selected.driver.latitude != null &&
                      selected.driver.longitude != null && (
                        <InfoWindow
                          position={{
                            lat: selected.driver.latitude,
                            lng: selected.driver.longitude,
                          }}
                          onCloseClick={() => setSelected(null)}
                        >
                          <DriverInfoCard
                            driver={selected.driver}
                            onOpen={() =>
                              navigate(`/drivers/${selected.driver.userId}`)
                            }
                          />
                        </InfoWindow>
                      )}
                  </Map>
                </APIProvider>
              )}
            </CardContent>
          </Card>

          {/* List */}
          <Card>
            <CardContent className="p-0">
              <div className="border-b p-3">
                <p className="text-sm font-semibold">
                  Online drivers ({drivers.length})
                </p>
              </div>
              {driversQuery.isLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : drivers.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    icon={Truck}
                    title="No drivers online"
                    description="Nothing to show until at least one approved driver flips themselves online from the mobile app."
                  />
                </div>
              ) : (
                <div className="max-h-[640px] divide-y overflow-y-auto">
                  {drivers.map((d) => {
                    const isSelected = selected?.driver.userId === d.userId;
                    return (
                      <button
                        key={d.userId}
                        type="button"
                        onClick={() => {
                          setSelected({ driver: d });
                        }}
                        className={`w-full px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                          isSelected ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {d.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {d.vehicleType ?? 'No vehicle'}
                              {d.vehiclePlate ? ` · ${d.vehiclePlate}` : ''}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Last seen{' '}
                              {formatDistanceToNowStrict(
                                new Date(d.lastSeenAt),
                                { addSuffix: true },
                              )}
                            </p>
                          </div>
                          {d.isOnDelivery ? (
                            <Badge variant="warning">On delivery</Badge>
                          ) : (
                            <Badge variant="success">Idle</Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DriverInfoCard({
  driver,
  onOpen,
}: {
  driver: LiveDriverRow;
  onOpen: () => void;
}) {
  return (
    <div className="min-w-[200px] space-y-1 text-sm">
      <p className="font-semibold">{driver.name}</p>
      <p className="text-xs text-muted-foreground">
        {driver.vehicleType ?? 'No vehicle'}
        {driver.vehiclePlate ? ` · ${driver.vehiclePlate}` : ''}
      </p>
      <p className="text-xs text-muted-foreground">
        Last seen{' '}
        {formatDistanceToNowStrict(new Date(driver.lastSeenAt), {
          addSuffix: true,
        })}
      </p>
      {driver.activeOrderId && (
        <p className="text-xs">
          Active order{' '}
          <code className="rounded bg-muted px-1">
            #{driver.activeOrderId.slice(0, 8)}
          </code>
        </p>
      )}
      <button
        type="button"
        onClick={onOpen}
        className="mt-1 text-xs font-semibold text-primary hover:underline"
      >
        Open driver detail →
      </button>
    </div>
  );
}
