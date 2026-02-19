import apiClient, { setTokens, clearTokens } from './client';
import type { AuthResponse, LoginDto, User } from '@/types';

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
};
