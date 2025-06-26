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
    // For demonstration purposes, return mock data that matches the external API format
    // In production, this would be a direct call to the actual LLM API service
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          api_logs: [
            {
              args: {},
              content_length: null,
              content_type: "application/json",
              endpoint: "api.health_check",
              level: "INFO",
              message: "Incoming request",
              method: "GET",
              module: "logger",
              remote_addr: "127.0.0.1",
              request_id: `req_${Date.now()}_health`,
              timestamp: new Date().toISOString(),
              type: "request",
              url: "http://127.0.0.1:5000/api/v1/health",
              user_agent: "Mozilla/5.0 (compatible; LLM-Platform/1.0)"
            },
            {
              content_length: 41,
              content_type: "application/json",
              duration_ms: 15.23,
              endpoint: "api.health_check",
              level: "INFO",
              message: "Outgoing response",
              method: "GET",
              module: "logger",
              request_id: `req_${Date.now()}_health`,
              status_code: 200,
              timestamp: new Date(Date.now() + 15).toISOString(),
              type: "response",
              url: "http://127.0.0.1:5000/api/v1/health"
            },
            {
              args: {},
              content_length: null,
              content_type: null,
              endpoint: "api.list_models",
              level: "INFO",
              message: "Incoming request",
              method: "GET",
              module: "logger",
              remote_addr: "127.0.0.1",
              request_id: `req_${Date.now()}_models`,
              timestamp: new Date(Date.now() + 100).toISOString(),
              type: "request",
              url: "http://127.0.0.1:5000/api/v1/models",
              user_agent: "Mozilla/5.0 (compatible; LLM-Platform/1.0)"
            },
            {
              duration_s: 0.035,
              endpoint: "list_models",
              level: "INFO",
              message: "Endpoint list_models completed successfully in 0.035s",
              module: "logger",
              status: "success",
              timestamp: new Date(Date.now() + 135).toISOString(),
              type: "endpoint_execution"
            },
            {
              args: { model: "llama2-7b" },
              content_length: 256,
              content_type: "application/json",
              endpoint: "api.generate",
              level: "INFO",
              message: "Text generation request",
              method: "POST",
              module: "logger",
              remote_addr: "127.0.0.1",
              request_id: `req_${Date.now()}_generate`,
              timestamp: new Date(Date.now() + 200).toISOString(),
              type: "request",
              url: "http://127.0.0.1:5000/api/v1/generate",
              user_agent: "Mozilla/5.0 (compatible; LLM-Platform/1.0)"
            },
            {
              content_length: 1024,
              content_type: "application/json",
              duration_ms: 2340.5,
              endpoint: "api.generate",
              level: "INFO",
              message: "Text generation completed",
              method: "POST",
              module: "logger",
              request_id: `req_${Date.now()}_generate`,
              status_code: 200,
              timestamp: new Date(Date.now() + 2540).toISOString(),
              type: "response",
              url: "http://127.0.0.1:5000/api/v1/generate"
            }
          ],
          error_logs: [
            {
              endpoint: "api.upload_model",
              level: "ERROR",
              message: "Model upload failed: insufficient disk space",
              method: "POST",
              module: "logger",
              remote_addr: "127.0.0.1",
              request_id: `req_${Date.now()}_upload_error`,
              timestamp: new Date(Date.now() + 300).toISOString(),
              type: "request",
              url: "http://127.0.0.1:5000/api/v1/models/upload",
              user_agent: "Mozilla/5.0 (compatible; LLM-Platform/1.0)"
            }
          ]
        });
      }, 500); // Simulate network delay
    });
  }
}

export const api = new LocalLLMAPI();
