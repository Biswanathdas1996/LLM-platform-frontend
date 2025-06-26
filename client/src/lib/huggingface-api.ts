export interface HuggingFaceModel {
  model_id: string;
  name: string;
  model_type: string;
  description?: string;
  parameters?: Record<string, any>;
  added_date: string;
  last_used?: string | null;
  usage_count: number;
  status: string;
}

export interface GenerateRequest {
  model_id: string;
  prompt: string;
  max_new_tokens?: number;
  temperature?: number;
  do_sample?: boolean;
  top_p?: number;
  top_k?: number;
  repetition_penalty?: number;
}

export interface GenerateResponse {
  success: boolean;
  response: string;
  model_used: string;
  prompt: string;
  parameters: Record<string, any>;
  model_info: {
    model_id: string;
    name: string;
    model_type: string;
  };
}

export interface PipelineRequest {
  model_id: string;
  task: string;
  inputs: string;
  max_length?: number;
  min_length?: number;
  do_sample?: boolean;
  num_return_sequences?: number;
}

export interface PipelineResponse {
  success: boolean;
  results: Array<{ generated_text: string }>;
  model_used: string;
  task: string;
  inputs: string;
  model_info: {
    model_id: string;
    name: string;
    model_type: string;
  };
}

export interface ModelsResponse {
  success: boolean;
  models: HuggingFaceModel[];
  count: number;
}

export interface CacheInfo {
  success: boolean;
  cached_models: Record<string, {
    loaded_at: string;
    device: string;
    model_type: string;
  }>;
  cached_pipelines: string[];
  total_cached: number;
}

export interface Statistics {
  success: boolean;
  statistics: {
    total_models: number;
    total_usage: number;
    model_types: Record<string, number>;
    last_updated: string;
    most_used: {
      model_id: string;
      name: string;
      usage_count: number;
    };
  };
}

export interface Dependencies {
  success: boolean;
  dependencies: {
    transformers: boolean;
    torch: boolean;
    cuda_available: boolean;
  };
}

export class HuggingFaceAPI {
  private baseUrl = '/api/huggingface';

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Model Management
  async getModels(type?: string): Promise<ModelsResponse> {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    return this.request(`/models${query}`);
  }

  async getModel(modelId: string): Promise<{ success: boolean; model: HuggingFaceModel }> {
    return this.request(`/models/${encodeURIComponent(modelId)}`);
  }

  async addModel(model: Omit<HuggingFaceModel, 'added_date' | 'last_used' | 'usage_count' | 'status'>): Promise<{ success: boolean; model: HuggingFaceModel; message: string }> {
    return this.request('/models', {
      method: 'POST',
      body: JSON.stringify(model),
    });
  }

  async updateModel(modelId: string, updates: Partial<Pick<HuggingFaceModel, 'name' | 'description' | 'parameters'>>): Promise<{ success: boolean; model: HuggingFaceModel; message: string }> {
    return this.request(`/models/${encodeURIComponent(modelId)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteModel(modelId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/models/${encodeURIComponent(modelId)}`, {
      method: 'DELETE',
    });
  }

  async loadModel(modelId: string, forceReload = false): Promise<{ success: boolean; message: string; model_info: any; device: string }> {
    return this.request(`/models/${encodeURIComponent(modelId)}/load`, {
      method: 'POST',
      body: JSON.stringify({ force_reload: forceReload }),
    });
  }

  // Text Generation
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    return this.request('/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async pipeline(request: PipelineRequest): Promise<PipelineResponse> {
    return this.request('/pipeline', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Cache Management
  async getCacheInfo(): Promise<CacheInfo> {
    return this.request('/cache');
  }

  async clearCache(modelId?: string): Promise<{ success: boolean; message: string }> {
    const query = modelId ? `?model_id=${encodeURIComponent(modelId)}` : '';
    return this.request(`/cache${query}`, {
      method: 'DELETE',
    });
  }

  // Statistics and Info
  async getStatistics(): Promise<Statistics> {
    return this.request('/statistics');
  }

  async getModelTypes(): Promise<{ success: boolean; model_types: string[] }> {
    return this.request('/model-types');
  }

  async getDependencies(): Promise<Dependencies> {
    return this.request('/dependencies');
  }
}

export const huggingFaceApi = new HuggingFaceAPI();