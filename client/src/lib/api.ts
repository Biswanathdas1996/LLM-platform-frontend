// Real API integration with Local LLM backend
// This connects to the Flask backend running on localhost:5001

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
  max_tokens?: number;
}

export interface GenerateResponse {
  success: boolean;
  response: string;
  model_used: string;
  processing_time: number;
  token_count: number;
  total_tokens?: number;
  efficiency_score?: number;
  pool_stats?: any;
  error?: string;
}

export interface PerformanceMetrics {
  success: boolean;
  optimization_status: {
    service_type: string;
    langchain_removed: boolean;
    direct_inference: boolean;
    memory_mapping_enabled: boolean;
    model_pooling_enabled: boolean;
  };
  performance_metrics: {
    avg_tokens_per_second: number;
    success_rate: number;
  };
  service_stats: any;
  system_stats: {
    cpu_percent: number;
    memory_percent: number;
    memory_available_gb: number;
  };
  gpu_stats: {
    gpu_available: boolean;
    gpu_count?: number;
    gpu_memory_used?: number;
    gpu_memory_cached?: number;
  };
  timestamp: number;
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

export interface RAGQueryRequest {
  index_names: string[];
  query: string;
  k?: number;
  mode?: 'vector' | 'keyword' | 'hybrid';
}

export interface RAGQueryResult {
  text: string;
  score: number;
  document_name: string;
  chunk_id: number;
  keywords: string[];
  index_name: string;
  metadata: any;
}

export interface RAGQueryResponse {
  success: boolean;
  query: string;
  results: RAGQueryResult[];
  mode: string;
  total_results: number;
  error?: string;
}

export class LocalLLMAPI {
  private baseURL: string;

  constructor() {
    // Default to localhost:5001 where the Flask backend runs
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
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

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return this.makeRequest<PerformanceMetrics>('/api/v1/performance');
  }

  async queryRAG(request: RAGQueryRequest): Promise<RAGQueryResponse> {
    return this.makeRequest<RAGQueryResponse>('/api/rag/query-multiple', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

export const api = new LocalLLMAPI();
