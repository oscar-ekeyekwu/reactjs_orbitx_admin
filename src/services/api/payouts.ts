import { apiClient } from './client';

export interface PendingPayout {
  id: string;
  recipientUserId: string;
  recipient?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    name?: string | null;
    email?: string | null;
  };
  amount: number | string;
  status: 'pending_manual' | string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

interface PendingPayoutEnvelope {
  items: PendingPayout[];
  total: number;
}

/**
 * G4 — admin disbursement queue API.
 */
export const payoutsApi = {
  listManual: async (
    page: number = 1,
    limit: number = 50,
  ): Promise<PendingPayoutEnvelope> => {
    const offset = (page - 1) * limit;
    const response = await apiClient.get<PendingPayoutEnvelope>(
      '/admin/payouts',
      { params: { limit, offset } },
    );
    return response.data;
  },

  markPaid: async (
    id: string,
    receiptReference: string,
  ): Promise<PendingPayout> => {
    const response = await apiClient.post<PendingPayout>(
      `/admin/payouts/${encodeURIComponent(id)}/mark-paid`,
      { receiptReference },
    );
    return response.data;
  },
};
