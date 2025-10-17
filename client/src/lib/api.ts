// Real API integration with Local LLM backend
// This connects to the Flask backend running on localhost:5000

export interface ApiModel {
  name: string;
  path: string;
  size: string;
  modified: string;
  status?: string;
  type?: string;
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
  level: "INFO" | "ERROR" | "WARN" | "DEBUG";
  message: string;
  method?: string;
  module: string;
  remote_addr?: string;
  request_id?: string;
  timestamp: string;
  type: "request" | "response" | "endpoint_execution";
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
  private baseURL: string;

  constructor() {
    // Default to localhost:5000 where the Flask backend runs
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: defaultHeaders,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async health(): Promise<HealthResponse> {
    return this.makeRequest<HealthResponse>('/api/v1/health');
  }

  async getModels(): Promise<ModelsResponse> {
    return this.makeRequest<ModelsResponse>('/api/v1/models');
  }

  async uploadModel(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/api/v1/models`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async deleteModel(modelName: string): Promise<any> {
    return this.makeRequest(`/api/v1/models/${modelName}`, {
      method: 'DELETE',
    });
  }

  async syncModels(): Promise<any> {
    return this.makeRequest('/api/v1/models/sync', {
      method: 'POST',
    });
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    return this.makeRequest<GenerateResponse>('/api/v1/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async clearCache(): Promise<any> {
    return this.makeRequest('/api/v1/cache/clear', {
      method: 'POST',
    });
  }

  async getCacheStatus(): Promise<CacheStatusResponse> {
    return this.makeRequest<CacheStatusResponse>('/api/v1/cache/status');
  }

  async getLogs(): Promise<ExternalLogsResponse> {
    return this.makeRequest<ExternalLogsResponse>('/api/v1/logs');
  }
}

export const api = new LocalLLMAPI();
