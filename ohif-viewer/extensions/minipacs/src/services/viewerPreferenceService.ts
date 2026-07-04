import { viewerApiClient } from './viewerApiClient';

export const viewerPreferenceService = {
  getPreferences: async () => {
    try {
      const response = await viewerApiClient.get<any>('/api/viewer/preferences');
      if (response.ok && response.data?.success) {
        return response.data.data;
      }
      return null;
    } catch (e) {
      console.error('Failed to load viewer preferences', e);
      return null;
    }
  },
  savePreferences: async (data: any) => {
    try {
      const response = await viewerApiClient.put<any>('/api/viewer/preferences', data);
      return response.ok && response.data?.success;
    } catch (e) {
      console.error('Failed to save viewer preferences', e);
      return false;
    }
  },
  resetPreferences: async () => {
    try {
      const response = await viewerApiClient.post<any>('/api/viewer/preferences/reset');
      return response.ok && response.data?.success;
    } catch (e) {
      console.error('Failed to reset preferences', e);
      return false;
    }
  }
};
