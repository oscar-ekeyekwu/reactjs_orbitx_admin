import { apiClient } from './client';

export interface PendingTransfer {
  id: string;
  customerId: string;
  customer?: {
    id: string;
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    name?: string | null;
  };
  estimatedPrice: number | string;
  finalPrice: number | string | null;
  paymentMethod: 'bank_transfer' | string;
  paymentStatus: 'pending_transfer' | string;
  createdAt: string;
}

interface PendingTransferListEnvelope {
  items: PendingTransfer[];
  total: number;
}

/**
 * G3 / H8 — admin reconcile API for the manual bank-transfer queue.
 */
export const transfersApi = {
  listPending: async (
    page: number = 1,
    limit: number = 50,
  ): Promise<PendingTransferListEnvelope> => {
    const offset = (page - 1) * limit;
    const response = await apiClient.get<PendingTransferListEnvelope>(
      '/admin/transfers',
      { params: { limit, offset } },
    );
    return response.data;
  },

  reconcile: async (reference: string): Promise<PendingTransfer> => {
    const response = await apiClient.post<PendingTransfer>(
      `/admin/transfers/${encodeURIComponent(reference)}/reconcile`,
    );
    return response.data;
  },
};
