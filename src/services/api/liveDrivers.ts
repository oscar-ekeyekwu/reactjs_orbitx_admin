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
  /** "approved" or "active" — "approved" means the chained
   *  approved→active transition didn't run, so the driver is online
   *  but still won't receive order pushes. Surface this on the
   *  dispatcher view so admins can fix the stuck state. */
  verificationStatus: 'approved' | 'active';
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
