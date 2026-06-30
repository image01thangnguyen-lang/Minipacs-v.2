import { viewerApiClient } from './viewerApiClient';

export type ViewerDiagnosticsResponse = {
  ok: boolean;
  timestamp: string;
  services: {
    auth: {
      ok: boolean;
      userId?: string;
      permissions?: string[];
    };
    database: {
      ok: boolean;
    };
    dicomweb: {
      ok: boolean;
      baseUrl?: string;
      message?: string;
    };
    viewerApi: {
      ok: boolean;
    };
    reportWorkspace: {
      ok: boolean;
      enabled: boolean;
    };
  };
  warnings: string[];
};

class ViewerDiagnosticsService {
  async getDiagnostics(): Promise<{ data?: ViewerDiagnosticsResponse | null, error?: string }> {
    const result = await viewerApiClient.get<ViewerDiagnosticsResponse>('/api/viewer/diagnostics');
    if (!result.ok) {
      console.error('Failed to get diagnostics:', result.message);
      return { error: result.message || 'Khong the ket noi den Backend API.' };
    }
    return { data: result.data || null };
  }
}

export const viewerDiagnosticsService = new ViewerDiagnosticsService();
