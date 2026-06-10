import apiClient from './client';

export interface OpenRequestRow {
  id: string;
  customerId: string;
  customerName: string | null;
  pickupAddress: string;
  deliveryAddress: string;
  packageSize: 'small' | 'medium' | 'large';
  /** Naira string, e.g. "1500.00". */
  quotedPrice: string;
  distanceKm: number | null;
  pendingOfferCount: number;
  expiresAt: string;
  createdAt: string;
}

/**
 * Phase 2 dispatcher snapshot. The page polls every ~10s; the
 * backend resolves the offer-count via a single LATERAL join so
 * the polling cost is bounded.
 */
export const orderRequestsApi = {
  listOpen: async (): Promise<OpenRequestRow[]> => {
    const res = await apiClient.get<OpenRequestRow[]>(
      '/order-requests/admin/open',
    );
    return res.data;
  },
};
