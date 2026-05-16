import apiClient, { setTokens, clearTokens } from './client';
import type { AuthResponse, LoginDto, User } from '@/types';

export interface AdminSession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceId: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    const authData = response.data;

    // Verify user is admin
    if (authData.user.role !== 'admin') {
      throw new Error('Access denied. Admin privileges required.');
    }

    setTokens(authData.access_token, authData.refresh_token);
    return authData;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/profile');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    const authData = response.data;
    setTokens(authData.access_token, authData.refresh_token);
    return authData;
  },

  changePassword: async (data: ChangePasswordDto): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      '/auth/change-password',
      data,
    );
    return response.data;
  },

  listSessions: async (): Promise<AdminSession[]> => {
    const response = await apiClient.get<AdminSession[]>('/auth/sessions');
    return response.data;
  },

  revokeSession: async (id: string): Promise<void> => {
    await apiClient.delete(`/auth/sessions/${id}`);
  },
};
