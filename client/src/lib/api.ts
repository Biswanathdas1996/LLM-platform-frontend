const API_BASE_URL = 'http://127.0.0.1:5000/api/v1';

export interface ApiModel {
  name: string;
  path: string;
  size: string;
  modified: string;
}

export interface GenerateRequest {
  question: string;
  model_name: string;
  template?: string;
  n_gpu_layers?: number;
  n_batch?: number;
  temperature?: number;
}

export interface GenerateResponse {
  success: boolean;
  response: string;
  model_used: string;
  processing_time: number;
  token_count: number;
  error?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

export interface ModelsResponse {
  models: ApiModel[];
  count: number;
}

export interface CacheStatusResponse {
  cached_models: string[];
  count: number;
}

export interface ExternalLogEntry {
  args?: any;
  content_length?: number | null;
  content_type?: string | null;
  endpoint: string;
  level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';
  message: string;
  method?: string;
  module: string;
  remote_addr?: string;
  request_id?: string;
  timestamp: string;
  type: 'request' | 'response' | 'endpoint_execution';
  url?: string;
  user_agent?: string;
  duration_ms?: number;
  duration_s?: number;
  status_code?: number;
  status?: string;
  response_body?: any;
}

export interface ExternalLogsResponse {
  api_logs: ExternalLogEntry[];
  error_logs: ExternalLogEntry[];
}

export class LocalLLMAPI {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Local LLM API is not running. Please start the LLM service on port 5000.');
      }
      throw error;
    }
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  async getModels(): Promise<ModelsResponse> {
    return this.request<ModelsResponse>('/models');
  }

  async uploadModel(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/models`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload Error: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Local LLM API is not running. Please start the LLM service on port 5000.');
      }
      throw error;
    }
  }

  async deleteModel(modelName: string): Promise<any> {
    return this.request(`/models/${modelName}`, {
      method: 'DELETE',
    });
  }

  async syncModels(): Promise<any> {
    return this.request('/models/sync', {
      method: 'POST',
    });
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    return this.request<GenerateResponse>('/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async clearCache(): Promise<any> {
    return this.request('/cache/clear', {
      method: 'POST',
    });
  }

  async getCacheStatus(): Promise<CacheStatusResponse> {
    return this.request<CacheStatusResponse>('/cache/status');
  }

  async getLogs(): Promise<ExternalLogsResponse> {
    return this.request<ExternalLogsResponse>('/logs');
  }
}

export const api = new LocalLLMAPI();
