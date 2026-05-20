import apiClient from './client';

export type IncidentStatus = 'open' | 'acknowledged' | 'closed';
export type IncidentOutcome =
  | 'resolved'
  | 'escalated_frsc'
  | 'referred_insurance'
  | 'false_alarm';

export interface Incident {
  id: string;
  orderId: string;
  driverId: string;
  latitude: number | string | null;
  longitude: number | string | null;
  status: IncidentStatus;
  outcome: IncidentOutcome | null;
  outcomeNote: string | null;
  raisedAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  closedAt: string | null;
  closedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CloseIncidentDto {
  outcome: IncidentOutcome;
  outcomeNote: string;
}

/**
 * I6 — admin-side incident workflow client. Driver-side SOS POST is
 * mobile-only.
 */
export const incidentsApi = {
  list: async (status?: IncidentStatus): Promise<Incident[]> => {
    const response = await apiClient.get<Incident[]>('/incidents', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  findOne: async (id: string): Promise<Incident> => {
    const response = await apiClient.get<Incident>(`/incidents/${id}`);
    return response.data;
  },

  acknowledge: async (id: string): Promise<Incident> => {
    const response = await apiClient.post<Incident>(
      `/incidents/${id}/acknowledge`,
    );
    return response.data;
  },

  close: async (id: string, dto: CloseIncidentDto): Promise<Incident> => {
    const response = await apiClient.post<Incident>(
      `/incidents/${id}/close`,
      dto,
    );
    return response.data;
  },
};
