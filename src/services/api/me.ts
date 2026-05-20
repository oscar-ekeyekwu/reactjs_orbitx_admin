import apiClient from './client';

export interface MeDeletionStatus {
  deletionScheduledAt: string | null;
  executesAt: string | null;
}

export interface MeConsentResponse {
  consentedAt: string | null;
}

/**
 * I1 — NDPA data-subject-rights client. Mirrors the backend MeController.
 * The export endpoint returns a JSON blob the page surfaces via download.
 */
export const meApi = {
  export: async (): Promise<unknown> => {
    const response = await apiClient.get<unknown>('/me/export');
    return response.data;
  },

  requestDelete: async (): Promise<MeDeletionStatus> => {
    const response = await apiClient.post<MeDeletionStatus>('/me/delete');
    return response.data;
  },

  cancelDelete: async (): Promise<MeDeletionStatus> => {
    const response = await apiClient.delete<MeDeletionStatus>('/me/delete');
    return response.data;
  },

  consent: async (): Promise<MeConsentResponse> => {
    const response = await apiClient.post<MeConsentResponse>('/me/consent');
    return response.data;
  },
};
