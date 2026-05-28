import apiClient from './client';

export interface MapsSettings {
  configured: boolean;
  /** Masked display value, e.g. `•••••••••••AIza`. Never the plaintext. */
  maskedKey: string;
}

export interface UpdateMapsSettingsDto {
  apiKey: string;
}

/**
 * Wraps `/config/maps-settings` — admin-only read + write surface for
 * the Google Maps API key the backend proxy uses. The plaintext key
 * is sent on PUT but never returned on GET (masked).
 */
export const mapsSettingsApi = {
  get: async (): Promise<MapsSettings> => {
    const res = await apiClient.get<MapsSettings>('/config/maps-settings');
    return res.data;
  },

  update: async (dto: UpdateMapsSettingsDto): Promise<MapsSettings> => {
    const res = await apiClient.put<MapsSettings>(
      '/config/maps-settings',
      dto,
    );
    return res.data;
  },
};
