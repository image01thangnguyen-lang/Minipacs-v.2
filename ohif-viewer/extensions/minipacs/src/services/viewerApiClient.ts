export type ApiResult<T> = {
  ok: boolean;
  data?: T;
  message?: string;
};

class ViewerApiClient {
  private async request<T>(url: string, options: RequestInit): Promise<ApiResult<T>> {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        return { ok: false, message: `HTTP Error: ${response.status} ${response.statusText}` };
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return { ok: true, data };
      }
      
      return { ok: true };
    } catch (error) {
      console.error('[ViewerApiClient] Network Error:', error);
      return { ok: false, message: 'Network error or backend unavailable' };
    }
  }

  get<T>(url: string, headers?: HeadersInit): Promise<ApiResult<T>> {
    return this.request<T>(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...headers,
      },
    });
  }

  post<T>(url: string, body?: any, headers?: HeadersInit): Promise<ApiResult<T>> {
    return this.request<T>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const viewerApiClient = new ViewerApiClient();
