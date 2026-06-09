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

  /**
   * Plaintext key for admin browser surfaces that need to load the
   * Google Maps JS library (Live Drivers map). The key is bound to a
   * URL parameter in the loaded `<script>` anyway, so returning it
   * here is no greater exposure than the rendered page.
   */
  getKey: async (): Promise<{ apiKey: string }> => {
    const res = await apiClient.get<{ apiKey: string }>(
      '/config/maps-settings/key',
    );
    return res.data;
  },
};
