// Client HTTP unifié pour les appels API REST
// Remplace les appels directs Supabase côté client

import { APIError, createErrorFromResponse, TimeoutError, NetworkError } from './errors';

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export class APIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    this.timeout = 10000; // 10s timeout
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { ...this.defaultHeaders, ...config?.headers };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config?.timeout || this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
        credentials: 'include', // Important pour les cookies de session
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }
        throw createErrorFromResponse(response, errorData);
      }

      const result = await response.json();
      return result.data || result; // Support du format standardisé
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError('Request timeout');
      }
      
      throw new NetworkError('Network error occurred');
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', endpoint, data, config);
  }

  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', endpoint, data, config);
  }

  async patch<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, config);
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }

  // Intercepteurs pour logging et monitoring
  onRequest(callback: (url: string, options: any) => void) {
    // Implementation future pour intercepteurs
  }

  onResponse(callback: (response: Response) => void) {
    // Implementation future pour intercepteurs
  }

  onError(callback: (error: APIError) => void) {
    // Implementation future pour intercepteurs
  }
}

// Export de toutes les classes d'erreurs pour utilisation externe
export { APIError, createErrorFromResponse, TimeoutError, NetworkError } from './errors';

// Instance globale du client API
export const apiClient = new APIClient();
