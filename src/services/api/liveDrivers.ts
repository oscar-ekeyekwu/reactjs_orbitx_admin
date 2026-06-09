import apiClient from './client';

export interface LiveDriverRow {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  lastSeenAt: string;
  isOnDelivery: boolean;
  vehicleType: string | null;
  vehiclePlate: string | null;
  activeOrderId: string | null;
}

/**
 * Live-dispatcher snapshot. Polled by the admin Live Drivers page
 * every ~10s; the backend resolves in a single SQL pass so the
 * polling cost is bounded.
 */
export const liveDriversApi = {
  list: async (): Promise<LiveDriverRow[]> => {
    const response = await apiClient.get<LiveDriverRow[]>(
      '/drivers/admin/online',
    );
    return response.data;
  },
};
