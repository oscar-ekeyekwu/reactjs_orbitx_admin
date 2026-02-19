import apiClient from './client';
import type { User, PaginatedResponse, UserRole } from '@/types';

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
}

export interface CreateDriverDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  phone?: string;
  isActive?: boolean;
}

export const usersApi = {
  getAll: async (params?: UsersQueryParams): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get<PaginatedResponse<User>>('/users', { params });
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  getCustomers: async (params?: Omit<UsersQueryParams, 'role'>): Promise<PaginatedResponse<User>> => {
    return usersApi.getAll({ ...params, role: 'customer' });
  },

  getDrivers: async (params?: Omit<UsersQueryParams, 'role'>): Promise<PaginatedResponse<User>> => {
    return usersApi.getAll({ ...params, role: 'driver' });
  },

  createDriver: async (data: CreateDriverDto): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', {
      ...data,
      role: 'driver',
    });
    return response.data;
  },

  update: async (id: string, data: UpdateUserDto): Promise<User> => {
    const response = await apiClient.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  toggleActive: async (id: string, isActive: boolean): Promise<User> => {
    return usersApi.update(id, { isActive });
  },
};
