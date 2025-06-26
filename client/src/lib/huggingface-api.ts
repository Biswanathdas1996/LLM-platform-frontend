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
  private baseUrl = 'https://api-inference.huggingface.co';
  private apiKey: string | null = null;

  constructor() {
    // Check for API key in environment variables or localStorage
    this.apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY || 
                 localStorage.getItem('huggingface_api_key') || 
                 null;
  }

  // Method to refresh API key from localStorage
  refreshApiKey(): void {
    this.apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY || 
                 localStorage.getItem('huggingface_api_key') || 
                 null;
  }

  // Check if API key is available
  hasApiKey(): boolean {
    this.refreshApiKey();
    return !!this.apiKey;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers,
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Local storage for managing models registry
  private getStoredModels(): HuggingFaceModel[] {
    const stored = localStorage.getItem('huggingface_models');
    return stored ? JSON.parse(stored) : [];
  }

  private saveModels(models: HuggingFaceModel[]): void {
    localStorage.setItem('huggingface_models', JSON.stringify(models));
  }

  private getStoredCache(): any {
    const stored = localStorage.getItem('huggingface_cache');
    return stored ? JSON.parse(stored) : { cached_models: {}, cached_pipelines: [], total_cached: 0 };
  }

  private saveCache(cache: any): void {
    localStorage.setItem('huggingface_cache', JSON.stringify(cache));
  }

  // Model Management (using local storage)
  async getModels(type?: string): Promise<ModelsResponse> {
    let models = this.getStoredModels();
    
    // Initialize with some popular models if none exist
    if (models.length === 0) {
      models = [
        {
          model_id: 'gpt2',
          name: 'GPT-2',
          model_type: 'text-generation',
          description: 'OpenAI GPT-2 language model',
          parameters: {
            max_new_tokens: 50,
            temperature: 0.8,
            do_sample: true,
            top_p: 0.9,
            top_k: 50,
            repetition_penalty: 1.1
          },
          added_date: new Date().toISOString(),
          last_used: null,
          usage_count: 0,
          status: 'available'
        },
        {
          model_id: 'microsoft/DialoGPT-medium',
          name: 'DialoGPT Medium',
          model_type: 'conversational',
          description: 'Microsoft conversational AI model',
          parameters: {
            max_new_tokens: 100,
            temperature: 0.7,
            do_sample: true,
            top_p: 0.9
          },
          added_date: new Date().toISOString(),
          last_used: null,
          usage_count: 0,
          status: 'available'
        }
      ];
      this.saveModels(models);
    }

    if (type && type !== 'all') {
      models = models.filter(model => model.model_type === type);
    }

    return {
      success: true,
      models,
      count: models.length
    };
  }

  async getModel(modelId: string): Promise<{ success: boolean; model: HuggingFaceModel }> {
    const models = this.getStoredModels();
    const model = models.find(m => m.model_id === modelId);
    
    if (!model) {
      throw new Error(`Model '${modelId}' not found`);
    }

    return { success: true, model };
  }

  async addModel(model: Omit<HuggingFaceModel, 'added_date' | 'last_used' | 'usage_count' | 'status'>): Promise<{ success: boolean; model: HuggingFaceModel; message: string }> {
    const models = this.getStoredModels();
    
    // Check if model already exists
    if (models.find(m => m.model_id === model.model_id)) {
      throw new Error(`Model '${model.model_id}' already exists`);
    }

    const newModel: HuggingFaceModel = {
      ...model,
      added_date: new Date().toISOString(),
      last_used: null,
      usage_count: 0,
      status: 'available'
    };

    models.push(newModel);
    this.saveModels(models);

    return {
      success: true,
      model: newModel,
      message: `Model '${model.model_id}' added successfully`
    };
  }

  async updateModel(modelId: string, updates: Partial<Pick<HuggingFaceModel, 'name' | 'description' | 'parameters'>>): Promise<{ success: boolean; model: HuggingFaceModel; message: string }> {
    const models = this.getStoredModels();
    const modelIndex = models.findIndex(m => m.model_id === modelId);
    
    if (modelIndex === -1) {
      throw new Error(`Model '${modelId}' not found`);
    }

    if (updates.name) models[modelIndex].name = updates.name;
    if (updates.description !== undefined) models[modelIndex].description = updates.description;
    if (updates.parameters) {
      models[modelIndex].parameters = { ...models[modelIndex].parameters, ...updates.parameters };
    }

    this.saveModels(models);

    return {
      success: true,
      model: models[modelIndex],
      message: `Model '${modelId}' updated successfully`
    };
  }

  async deleteModel(modelId: string): Promise<{ success: boolean; message: string }> {
    const models = this.getStoredModels();
    const modelIndex = models.findIndex(m => m.model_id === modelId);
    
    if (modelIndex === -1) {
      throw new Error(`Model '${modelId}' not found`);
    }

    models.splice(modelIndex, 1);
    this.saveModels(models);

    return {
      success: true,
      message: `Model '${modelId}' removed successfully`
    };
  }

  async loadModel(modelId: string, forceReload = false): Promise<{ success: boolean; message: string; model_info: any; device: string }> {
    const models = this.getStoredModels();
    const model = models.find(m => m.model_id === modelId);
    
    if (!model) {
      throw new Error(`Model '${modelId}' not found`);
    }

    // Update cache
    const cache = this.getStoredCache();
    cache.cached_models[modelId] = {
      loaded_at: new Date().toISOString(),
      device: 'browser',
      model_type: model.model_type
    };
    cache.total_cached = Object.keys(cache.cached_models).length;
    this.saveCache(cache);

    return {
      success: true,
      message: `Model '${modelId}' loaded successfully`,
      model_info: {
        model_id: model.model_id,
        name: model.name,
        model_type: model.model_type
      },
      device: 'browser'
    };
  }

  // Text Generation using HuggingFace Inference API
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const models = this.getStoredModels();
    const model = models.find(m => m.model_id === request.model_id);
    
    if (!model) {
      throw new Error(`Model '${request.model_id}' not found`);
    }

    try {
      const response = await this.request(`/models/${request.model_id}`, {
        method: 'POST',
        body: JSON.stringify({
          inputs: request.prompt,
          parameters: {
            max_new_tokens: request.max_new_tokens || 100,
            temperature: request.temperature || 0.7,
            do_sample: request.do_sample !== false,
            top_p: request.top_p || 0.9,
            top_k: request.top_k || 50,
            repetition_penalty: request.repetition_penalty || 1.1,
            return_full_text: false
          }
        }),
      });

      // Update model usage
      model.usage_count++;
      model.last_used = new Date().toISOString();
      this.saveModels(models);

      // Handle different response formats from HuggingFace
      let generatedText = '';
      const responseData = response as any;
      if (Array.isArray(responseData) && responseData.length > 0) {
        generatedText = responseData[0].generated_text || '';
      } else if (responseData.generated_text) {
        generatedText = responseData.generated_text;
      } else {
        throw new Error('Unexpected response format from HuggingFace API');
      }

      return {
        success: true,
        response: generatedText,
        model_used: request.model_id,
        prompt: request.prompt,
        parameters: {
          max_new_tokens: request.max_new_tokens || 100,
          temperature: request.temperature || 0.7,
          do_sample: request.do_sample !== false,
          top_p: request.top_p || 0.9,
          top_k: request.top_k || 50,
          repetition_penalty: request.repetition_penalty || 1.1
        },
        model_info: {
          model_id: model.model_id,
          name: model.name,
          model_type: model.model_type
        }
      };
    } catch (error) {
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async pipeline(request: PipelineRequest): Promise<PipelineResponse> {
    const models = this.getStoredModels();
    const model = models.find(m => m.model_id === request.model_id);
    
    if (!model) {
      throw new Error(`Model '${request.model_id}' not found`);
    }

    try {
      const response = await this.request(`/models/${request.model_id}`, {
        method: 'POST',
        body: JSON.stringify({
          inputs: request.inputs,
          parameters: {
            max_length: request.max_length || 130,
            min_length: request.min_length || 30,
            do_sample: request.do_sample || false,
            num_return_sequences: request.num_return_sequences || 1
          }
        }),
      });

      // Update model usage
      model.usage_count++;
      model.last_used = new Date().toISOString();
      this.saveModels(models);

      // Format response for pipeline results
      let results = [];
      const responseData = response as any;
      if (Array.isArray(responseData)) {
        results = responseData.map(item => ({
          generated_text: item.generated_text || item.summary_text || item.translation_text || JSON.stringify(item)
        }));
      } else if (responseData.generated_text || responseData.summary_text || responseData.translation_text) {
        results = [{
          generated_text: responseData.generated_text || responseData.summary_text || responseData.translation_text
        }];
      } else {
        results = [{ generated_text: JSON.stringify(responseData) }];
      }

      return {
        success: true,
        results,
        model_used: request.model_id,
        task: request.task,
        inputs: request.inputs,
        model_info: {
          model_id: model.model_id,
          name: model.name,
          model_type: model.model_type
        }
      };
    } catch (error) {
      throw new Error(`Failed to execute pipeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Cache Management (using local storage)
  async getCacheInfo(): Promise<CacheInfo> {
    const cache = this.getStoredCache();
    return {
      success: true,
      ...cache
    };
  }

  async clearCache(modelId?: string): Promise<{ success: boolean; message: string }> {
    const cache = this.getStoredCache();
    
    if (modelId) {
      delete cache.cached_models[modelId];
      cache.cached_pipelines = cache.cached_pipelines.filter((p: string) => !p.includes(modelId));
    } else {
      cache.cached_models = {};
      cache.cached_pipelines = [];
    }
    
    cache.total_cached = Object.keys(cache.cached_models).length;
    this.saveCache(cache);

    return {
      success: true,
      message: modelId ? `Cache cleared for model '${modelId}'` : 'All caches cleared'
    };
  }

  // Statistics and Info
  async getStatistics(): Promise<Statistics> {
    const models = this.getStoredModels();
    const totalUsage = models.reduce((sum, model) => sum + model.usage_count, 0);
    const modelTypes = models.reduce((acc, model) => {
      acc[model.model_type] = (acc[model.model_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostUsed = models.reduce((prev, current) => 
      current.usage_count > prev.usage_count ? current : prev, 
      models[0] || { model_id: '', name: '', usage_count: 0 }
    );

    return {
      success: true,
      statistics: {
        total_models: models.length,
        total_usage: totalUsage,
        model_types: modelTypes,
        last_updated: new Date().toISOString(),
        most_used: {
          model_id: mostUsed.model_id,
          name: mostUsed.name,
          usage_count: mostUsed.usage_count
        }
      }
    };
  }

  async getModelTypes(): Promise<{ success: boolean; model_types: string[] }> {
    const models = this.getStoredModels();
    const types = models
      .map(model => model.model_type)
      .filter((type, index, array) => array.indexOf(type) === index);

    return {
      success: true,
      model_types: types
    };
  }

  async getDependencies(): Promise<Dependencies> {
    // Check browser capabilities instead of server dependencies
    const hasFetch = typeof fetch !== 'undefined';
    const hasLocalStorage = typeof localStorage !== 'undefined';
    const hasWebGL = (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch {
        return false;
      }
    })();

    return {
      success: true,
      dependencies: {
        transformers: hasFetch && hasLocalStorage, // Browser-based transformers.js could work
        torch: false, // Not available in browser
        cuda_available: hasWebGL // WebGL as browser GPU acceleration
      }
    };
  }
}

export const huggingFaceApi = new HuggingFaceAPI();