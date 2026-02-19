import apiClient from './client';
import type { PriceSettings, FAQ, SupportTicket, PaginatedResponse, DashboardStats } from '@/types';

// Dashboard
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/admin/dashboard/stats');
    return response.data;
  },
};

// Price Settings
export interface UpdatePriceSettingsDto {
  baseFare?: number;
  perKmRate?: number;
  perMinuteRate?: number;
  minimumFare?: number;
  surgeFactor?: number;
  smallPackageMultiplier?: number;
  mediumPackageMultiplier?: number;
  largePackageMultiplier?: number;
}

export const priceSettingsApi = {
  get: async (): Promise<PriceSettings> => {
    const response = await apiClient.get<PriceSettings>('/admin/settings/pricing');
    return response.data;
  },

  update: async (data: UpdatePriceSettingsDto): Promise<PriceSettings> => {
    const response = await apiClient.put<PriceSettings>('/admin/settings/pricing', data);
    return response.data;
  },
};

// FAQs
export interface CreateFAQDto {
  question: string;
  answer: string;
  category: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateFAQDto extends Partial<CreateFAQDto> {}

export const faqApi = {
  getAll: async (): Promise<FAQ[]> => {
    const response = await apiClient.get<FAQ[]>('/faqs');
    return response.data;
  },

  getById: async (id: string): Promise<FAQ> => {
    const response = await apiClient.get<FAQ>(`/faqs/${id}`);
    return response.data;
  },

  create: async (data: CreateFAQDto): Promise<FAQ> => {
    const response = await apiClient.post<FAQ>('/faqs', data);
    return response.data;
  },

  update: async (id: string, data: UpdateFAQDto): Promise<FAQ> => {
    const response = await apiClient.patch<FAQ>(`/faqs/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/faqs/${id}`);
  },

  reorder: async (orderedIds: string[]): Promise<void> => {
    await apiClient.post('/faqs/reorder', { ids: orderedIds });
  },
};

// Support Tickets
export interface SupportTicketsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
}

export interface UpdateSupportTicketDto {
  status?: string;
  priority?: string;
  assignedTo?: string;
}

export const supportApi = {
  getAll: async (params?: SupportTicketsQueryParams): Promise<PaginatedResponse<SupportTicket>> => {
    const response = await apiClient.get<PaginatedResponse<SupportTicket>>('/support/tickets', { params });
    return response.data;
  },

  getById: async (id: string): Promise<SupportTicket> => {
    const response = await apiClient.get<SupportTicket>(`/support/tickets/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateSupportTicketDto): Promise<SupportTicket> => {
    const response = await apiClient.patch<SupportTicket>(`/support/tickets/${id}`, data);
    return response.data;
  },

  close: async (id: string): Promise<SupportTicket> => {
    return supportApi.update(id, { status: 'closed' });
  },
};
