export interface DeepSeekModel {
  name: string;
  path: string;
  size: string;
  modified: string;
  status: 'available' | 'loaded' | 'error';
}

export interface DeepSeekGenerateRequest {
  model_name: string;
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  n_ctx?: number;
  n_threads?: number;
  top_p?: number;
  top_k?: number;
  repeat_penalty?: number;
}

export interface DeepSeekGenerateResponse {
  success: boolean;
  generated_text: string;
  model: string;
  prompt: string;
  processing_time?: number;
  tokens_generated?: number;
  error?: string;
}

export interface DeepSeekHealthResponse {
  status: string;
  service: string;
  version?: string;
  uptime?: string;
}

export interface DeepSeekModelsResponse {
  success: boolean;
  models: DeepSeekModel[];
  count: number;
}

export class DeepSeekAPI {
  private baseUrl = 'http://localhost:5001';

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('DeepSeek API request failed:', error);
      throw error;
    }
  }

  async health(): Promise<DeepSeekHealthResponse> {
    return this.request<DeepSeekHealthResponse>('/api/deepseek/health');
  }

  async getModels(): Promise<DeepSeekModelsResponse> {
    return this.request<DeepSeekModelsResponse>('/api/deepseek/models');
  }

  async getModel(name: string): Promise<{ success: boolean; model: DeepSeekModel }> {
    return this.request<{ success: boolean; model: DeepSeekModel }>(`/api/deepseek/models/${name}`);
  }

  async generate(request: DeepSeekGenerateRequest): Promise<DeepSeekGenerateResponse> {
    return this.request<DeepSeekGenerateResponse>('/api/deepseek/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async quickTest(): Promise<DeepSeekGenerateResponse> {
    return this.request<DeepSeekGenerateResponse>('/api/deepseek/test', {
      method: 'POST',
    });
  }
}

export const deepSeekApi = new DeepSeekAPI();