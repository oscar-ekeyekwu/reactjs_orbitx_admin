import apiClient from './client';
import type { Order, PaginatedResponse, OrderStatus } from '@/types';

export interface OrdersQueryParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  customerId?: string;
  driverId?: string;
  startDate?: string;
  endDate?: string;
}

export const ordersApi = {
  getAll: async (params?: OrdersQueryParams): Promise<PaginatedResponse<Order>> => {
    const response = await apiClient.get<PaginatedResponse<Order>>('/orders', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const response = await apiClient.patch<Order>(`/orders/${id}/status`, { status });
    return response.data;
  },

  cancel: async (id: string, reason?: string): Promise<Order> => {
    const response = await apiClient.post<Order>(`/orders/${id}/cancel`, { reason });
    return response.data;
  },
};
