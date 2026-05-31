import apiClient from './client';
import type { DocumentType } from './documents';

/**
 * Driver-ID picker allowlist. The customer mobile reads this at the
 * start of the personal-step wizard and shows only the entries the
 * admin allows.
 */
export const idTypesApi = {
  /** GET /config/allowed-id-types */
  list: async (): Promise<{ allowed: DocumentType[] }> => {
    const response = await apiClient.get<{ allowed: DocumentType[] }>(
      '/config/allowed-id-types',
    );
    return response.data;
  },

  /** PUT /config/allowed-id-types — admin only. */
  update: async (
    allowed: DocumentType[],
  ): Promise<{ allowed: DocumentType[] }> => {
    const response = await apiClient.put<{ allowed: DocumentType[] }>(
      '/config/allowed-id-types',
      { allowed },
    );
    return response.data;
  },
};
