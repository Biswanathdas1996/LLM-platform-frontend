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
  stop?: string[];
  use_mlock?: boolean;
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
  success: boolean;
}

export interface DeepSeekModelsResponse {
  success: boolean;
  models: DeepSeekModel[];
  count: number;
}

export class DeepSeekAPI {
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
      console.error(`DeepSeek API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async health(): Promise<DeepSeekHealthResponse> {
    return this.makeRequest<DeepSeekHealthResponse>('/api/deepseek/health');
  }

  async getModels(): Promise<DeepSeekModelsResponse> {
    return this.makeRequest<DeepSeekModelsResponse>('/api/deepseek/models');
  }

  async getModel(name: string): Promise<{ success: boolean; model: DeepSeekModel }> {
    return this.makeRequest<{ success: boolean; model: DeepSeekModel }>(`/api/deepseek/models/${name}`);
  }

  async generate(request: DeepSeekGenerateRequest): Promise<DeepSeekGenerateResponse> {
    return this.makeRequest<DeepSeekGenerateResponse>('/api/deepseek/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async quickTest(prompt?: string): Promise<DeepSeekGenerateResponse> {
    const testPayload = prompt ? { prompt } : {};
    return this.makeRequest<DeepSeekGenerateResponse>('/api/deepseek/test', {
      method: 'POST',
      body: JSON.stringify(testPayload),
    });
  }
}

export const deepSeekApi = new DeepSeekAPI();