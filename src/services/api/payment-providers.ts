import apiClient from './client';

export type PaymentProviderKind = 'paystack';

export interface PaymentProvider {
  id: string;
  slug: string;
  kind: PaymentProviderKind;
  displayName: string;
  baseUrl: string;
  publicKey: string | null;
  secretKeyMasked: string;
  hasDedicatedWebhookSecret: boolean;
  enabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentProviderDto {
  slug: string;
  kind: PaymentProviderKind;
  displayName: string;
  baseUrl: string;
  publicKey?: string;
  secretKey: string;
  webhookSecret?: string;
  enabled?: boolean;
}

export interface UpdatePaymentProviderDto {
  displayName?: string;
  baseUrl?: string;
  publicKey?: string | null;
  secretKey?: string;
  webhookSecret?: string;
  enabled?: boolean;
}

export interface PaymentProviderTestResult {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

/**
 * PAY-1 — admin-only CRUD for the pluggable payment providers table.
 * Plaintext secrets only flow OUT of the browser (create/update DTOs);
 * the API never echoes them back — every read returns the masked tail.
 */
export const paymentProvidersApi = {
  list: async (): Promise<PaymentProvider[]> => {
    const response = await apiClient.get<PaymentProvider[]>(
      '/payment-providers',
    );
    return response.data;
  },

  get: async (id: string): Promise<PaymentProvider> => {
    const response = await apiClient.get<PaymentProvider>(
      `/payment-providers/${id}`,
    );
    return response.data;
  },

  create: async (
    dto: CreatePaymentProviderDto,
  ): Promise<PaymentProvider> => {
    const response = await apiClient.post<PaymentProvider>(
      '/payment-providers',
      dto,
    );
    return response.data;
  },

  update: async (
    id: string,
    dto: UpdatePaymentProviderDto,
  ): Promise<PaymentProvider> => {
    const response = await apiClient.patch<PaymentProvider>(
      `/payment-providers/${id}`,
      dto,
    );
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/payment-providers/${id}`);
  },

  activate: async (id: string): Promise<PaymentProvider> => {
    const response = await apiClient.post<PaymentProvider>(
      `/payment-providers/${id}/activate`,
    );
    return response.data;
  },

  test: async (id: string): Promise<PaymentProviderTestResult> => {
    const response = await apiClient.post<PaymentProviderTestResult>(
      `/payment-providers/${id}/test`,
    );
    return response.data;
  },
};
