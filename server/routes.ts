import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  module: string;
  request_id?: string;
  method?: string;
  url?: string;
  endpoint?: string;
  remote_addr?: string;
  user_agent?: string;
  status_code?: number;
  duration_ms?: number;
  content_type?: string;
  content_length?: number;
  type: string;
  args?: any;
  duration_s?: number;
  status?: string;
}

// In-memory log storage for this session
const sessionLogs: LogEntry[] = [];
const sessionErrorLogs: LogEntry[] = [];

// Log interceptor middleware
function logInterceptor(req: Request, res: Response, next: Function) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Log the incoming request
  const requestLog: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: `Incoming ${req.method} request`,
    module: 'express_server',
    request_id: requestId,
    method: req.method,
    url: req.url,
    endpoint: req.path,
    remote_addr: req.ip || req.connection.remoteAddress || '127.0.0.1',
    user_agent: req.headers['user-agent'] || 'Unknown',
    type: 'request',
    content_type: req.headers['content-type'],
    content_length: req.headers['content-length'] ? parseInt(req.headers['content-length'] as string) : undefined
  };
  
  sessionLogs.push(requestLog);
  
  // Use res.on('finish') instead of overriding res.end
  res.on('finish', () => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const responseLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 400 ? 'ERROR' : 'INFO',
      message: `${req.method} request completed`,
      module: 'express_server',
      request_id: requestId,
      method: req.method,
      url: req.url,
      endpoint: req.path,
      status_code: res.statusCode,
      duration_ms: duration,
      type: 'response',
      content_type: res.getHeader('content-type') as string,
      content_length: parseInt(res.getHeader('content-length') as string) || 0
    };
    
    if (res.statusCode >= 400) {
      sessionErrorLogs.push(responseLog);
    } else {
      sessionLogs.push(responseLog);
    }
  });
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Add logging middleware to all routes
  app.use(logInterceptor);

  // API Health check endpoint
  app.get('/api/v1/health', (req: Request, res: Response) => {
    const healthLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Health check completed successfully',
      module: 'health_checker',
      endpoint: 'health_check',
      type: 'endpoint_execution',
      duration_s: 0.001,
      status: 'success'
    };
    sessionLogs.push(healthLog);
    
    res.json({
      status: 'healthy',
      service: 'LLM Platform Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Models endpoint
  app.get('/api/v1/models', async (req: Request, res: Response) => {
    const modelsLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Models list retrieved successfully',
      module: 'models_manager',
      endpoint: 'list_models',
      type: 'endpoint_execution',
      duration_s: 0.025,
      status: 'success'
    };
    sessionLogs.push(modelsLog);

    res.json({
      models: [
        { name: 'llama2-7b', path: '/models/llama2-7b.bin', size: '3.8GB', modified: new Date().toISOString() },
        { name: 'mistral-7b', path: '/models/mistral-7b.bin', size: '4.1GB', modified: new Date().toISOString() },
        { name: 'codellama-13b', path: '/models/codellama-13b.bin', size: '7.2GB', modified: new Date().toISOString() }
      ],
      count: 3
    });
  });

  // Generate endpoint (simulate text generation)
  app.post('/api/v1/generate', async (req: Request, res: Response) => {
    const { question, model_name, temperature = 0.7, n_gpu_layers = 0 } = req.body;
    
    if (!question || !model_name) {
      const errorLog: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Generation failed: missing required parameters',
        module: 'text_generator',
        endpoint: 'generate',
        type: 'endpoint_execution',
        duration_s: 0.001,
        status: 'error'
      };
      sessionErrorLogs.push(errorLog);
      
      return res.status(400).json({ error: 'Missing required parameters: question and model_name' });
    }

    // Simulate processing time based on model complexity
    const processingTime = Math.random() * 3000 + 500; // 500ms to 3.5s
    
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    const generationLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: `Text generation completed using ${model_name}`,
      module: 'text_generator',
      endpoint: 'generate',
      type: 'endpoint_execution',
      duration_s: processingTime / 1000,
      status: 'success',
      args: { model: model_name, temperature, n_gpu_layers }
    };
    sessionLogs.push(generationLog);

    res.json({
      success: true,
      response: `This is a simulated response from ${model_name} for the question: "${question}". The model processed this with temperature ${temperature} and ${n_gpu_layers} GPU layers.`,
      model_used: model_name,
      processing_time: processingTime,
      token_count: Math.floor(Math.random() * 200) + 50
    });
  });

  // Logs endpoint - serves real accumulated logs
  app.get('/api/v1/logs', (req: Request, res: Response) => {
    const logsLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: `Logs retrieved: ${sessionLogs.length} API logs, ${sessionErrorLogs.length} error logs`,
      module: 'logs_manager',
      endpoint: 'get_logs',
      type: 'endpoint_execution',
      duration_s: 0.005,
      status: 'success'
    };
    sessionLogs.push(logsLog);

    res.json({
      api_logs: sessionLogs.slice(-1000), // Last 1000 logs
      error_logs: sessionErrorLogs.slice(-200) // Last 200 error logs
    });
  });

  // Cache status endpoint
  app.get('/api/v1/cache/status', (req: Request, res: Response) => {
    const cacheLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Cache status retrieved successfully',
      module: 'cache_manager',
      endpoint: 'cache_status',
      type: 'endpoint_execution',
      duration_s: 0.008,
      status: 'success'
    };
    sessionLogs.push(cacheLog);

    res.json({
      cached_models: ['llama2-7b', 'mistral-7b'],
      count: 2
    });
  });

  // Clear cache endpoint
  app.post('/api/v1/cache/clear', (req: Request, res: Response) => {
    const clearLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Cache cleared successfully',
      module: 'cache_manager',
      endpoint: 'clear_cache',
      type: 'endpoint_execution',
      duration_s: 0.150,
      status: 'success'
    };
    sessionLogs.push(clearLog);

    res.json({ success: true, message: 'Cache cleared successfully' });
  });

  // Model upload endpoint (simulate)
  app.post('/api/v1/models/upload', (req: Request, res: Response) => {
    // Simulate random upload failures for realistic error logs
    if (Math.random() < 0.2) {
      const errorLog: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Model upload failed: insufficient disk space',
        module: 'upload_manager',
        endpoint: 'upload_model',
        type: 'endpoint_execution',
        duration_s: 2.5,
        status: 'error'
      };
      sessionErrorLogs.push(errorLog);
      
      return res.status(507).json({ error: 'Insufficient disk space for model upload' });
    }

    const uploadLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Model uploaded successfully',
      module: 'upload_manager',
      endpoint: 'upload_model',
      type: 'endpoint_execution',
      duration_s: 15.2,
      status: 'success'
    };
    sessionLogs.push(uploadLog);

    res.json({ success: true, message: 'Model uploaded successfully' });
  });

  // HuggingFace API endpoints
  // Mock storage for HuggingFace models
  let huggingFaceModels: any[] = [
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
    }
  ];

  let huggingFaceCache: any = {
    cached_models: {},
    cached_pipelines: [],
    total_cached: 0
  };

  // HuggingFace Models Management
  app.get('/api/huggingface/models', (req: Request, res: Response) => {
    const type = req.query.type as string;
    let filteredModels = huggingFaceModels;
    
    if (type && type !== 'all') {
      filteredModels = huggingFaceModels.filter(model => model.model_type === type);
    }

    res.json({
      success: true,
      models: filteredModels,
      count: filteredModels.length
    });
  });

  app.get('/api/huggingface/models/:modelId', (req: Request, res: Response) => {
    const modelId = decodeURIComponent(req.params.modelId);
    const model = huggingFaceModels.find(m => m.model_id === modelId);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        error: `Model '${modelId}' not found`
      });
    }

    res.json({
      success: true,
      model
    });
  });

  app.post('/api/huggingface/models', (req: Request, res: Response) => {
    const { model_id, name, model_type, description, parameters } = req.body;
    
    if (!model_id || !name || !model_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: model_id, name, model_type'
      });
    }

    // Check if model already exists
    if (huggingFaceModels.find(m => m.model_id === model_id)) {
      return res.status(400).json({
        success: false,
        error: `Model '${model_id}' already exists`
      });
    }

    const newModel = {
      model_id,
      name,
      model_type,
      description: description || '',
      parameters: parameters || {},
      added_date: new Date().toISOString(),
      last_used: null,
      usage_count: 0,
      status: 'available'
    };

    huggingFaceModels.push(newModel);

    res.json({
      success: true,
      model: newModel,
      message: `Model '${model_id}' added successfully`
    });
  });

  app.put('/api/huggingface/models/:modelId', (req: Request, res: Response) => {
    const modelId = decodeURIComponent(req.params.modelId);
    const modelIndex = huggingFaceModels.findIndex(m => m.model_id === modelId);
    
    if (modelIndex === -1) {
      return res.status(404).json({
        success: false,
        error: `Model '${modelId}' not found`
      });
    }

    const { name, description, parameters } = req.body;
    
    if (name) huggingFaceModels[modelIndex].name = name;
    if (description !== undefined) huggingFaceModels[modelIndex].description = description;
    if (parameters) huggingFaceModels[modelIndex].parameters = { ...huggingFaceModels[modelIndex].parameters, ...parameters };

    res.json({
      success: true,
      model: huggingFaceModels[modelIndex],
      message: `Model '${modelId}' updated successfully`
    });
  });

  app.delete('/api/huggingface/models/:modelId', (req: Request, res: Response) => {
    const modelId = decodeURIComponent(req.params.modelId);
    const modelIndex = huggingFaceModels.findIndex(m => m.model_id === modelId);
    
    if (modelIndex === -1) {
      return res.status(404).json({
        success: false,
        error: `Model '${modelId}' not found`
      });
    }

    huggingFaceModels.splice(modelIndex, 1);

    res.json({
      success: true,
      message: `Model '${modelId}' removed successfully`
    });
  });

  app.post('/api/huggingface/models/:modelId/load', (req: Request, res: Response) => {
    const modelId = decodeURIComponent(req.params.modelId);
    const model = huggingFaceModels.find(m => m.model_id === modelId);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        error: `Model '${modelId}' not found`
      });
    }

    // Simulate loading the model into cache
    huggingFaceCache.cached_models[modelId] = {
      loaded_at: new Date().toISOString(),
      device: 'cuda',
      model_type: model.model_type
    };
    huggingFaceCache.total_cached = Object.keys(huggingFaceCache.cached_models).length;

    res.json({
      success: true,
      message: `Model '${modelId}' loaded successfully`,
      model_info: {
        model_id: model.model_id,
        name: model.name,
        model_type: model.model_type
      },
      device: 'cuda'
    });
  });

  // HuggingFace Text Generation
  app.post('/api/huggingface/generate', (req: Request, res: Response) => {
    const { model_id, prompt, max_new_tokens = 100, temperature = 0.7, do_sample = true, top_p = 0.9, top_k = 50, repetition_penalty = 1.1 } = req.body;
    
    if (!model_id || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: model_id, prompt'
      });
    }

    const model = huggingFaceModels.find(m => m.model_id === model_id);
    if (!model) {
      return res.status(404).json({
        success: false,
        error: `Model '${model_id}' not found`
      });
    }

    // Update model usage
    model.usage_count++;
    model.last_used = new Date().toISOString();

    // Simulate text generation with realistic responses
    const responses = [
      "bright and full of possibilities. With advances in machine learning and neural networks, we can expect to see more intelligent systems that can understand and interact with humans in natural ways.",
      "rapidly evolving, bringing unprecedented opportunities for innovation and problem-solving across various industries and sectors of society.",
      "transforming how we work, learn, and communicate. From healthcare to education, AI is reshaping our world in meaningful ways.",
      "promising but requires careful consideration of ethical implications and responsible development practices to ensure beneficial outcomes for all.",
      "powered by breakthrough research and computational advances that are making once-impossible applications now achievable."
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];

    res.json({
      success: true,
      response,
      model_used: model_id,
      prompt,
      parameters: {
        max_new_tokens,
        temperature,
        do_sample,
        top_p,
        top_k,
        repetition_penalty
      },
      model_info: {
        model_id: model.model_id,
        name: model.name,
        model_type: model.model_type
      }
    });
  });

  app.post('/api/huggingface/pipeline', (req: Request, res: Response) => {
    const { model_id, task, inputs, max_length = 130, min_length = 30, do_sample = false, num_return_sequences = 1 } = req.body;
    
    if (!model_id || !task || !inputs) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: model_id, task, inputs'
      });
    }

    const model = huggingFaceModels.find(m => m.model_id === model_id);
    if (!model) {
      return res.status(404).json({
        success: false,
        error: `Model '${model_id}' not found`
      });
    }

    // Update model usage
    model.usage_count++;
    model.last_used = new Date().toISOString();

    // Simulate pipeline results based on task
    let results = [];
    
    switch (task) {
      case 'text-generation':
        results = [{ generated_text: inputs + " and this continues with generated content..." }];
        break;
      case 'summarization':
        results = [{ generated_text: "This is a concise summary of the provided text content." }];
        break;
      case 'translation':
        results = [{ generated_text: "Este es el texto traducido al español." }];
        break;
      case 'sentiment-analysis':
        results = [{ label: 'POSITIVE', score: 0.9998 }];
        break;
      default:
        results = [{ generated_text: "Task completed successfully." }];
    }

    res.json({
      success: true,
      results,
      model_used: model_id,
      task,
      inputs,
      model_info: {
        model_id: model.model_id,
        name: model.name,
        model_type: model.model_type
      }
    });
  });

  // HuggingFace Cache Management
  app.get('/api/huggingface/cache', (req: Request, res: Response) => {
    res.json({
      success: true,
      ...huggingFaceCache
    });
  });

  app.delete('/api/huggingface/cache', (req: Request, res: Response) => {
    const modelId = req.query.model_id as string;
    
    if (modelId) {
      delete huggingFaceCache.cached_models[modelId];
      huggingFaceCache.cached_pipelines = huggingFaceCache.cached_pipelines.filter((p: string) => !p.includes(modelId));
    } else {
      huggingFaceCache.cached_models = {};
      huggingFaceCache.cached_pipelines = [];
    }
    
    huggingFaceCache.total_cached = Object.keys(huggingFaceCache.cached_models).length;

    res.json({
      success: true,
      message: modelId ? `Cache cleared for model '${modelId}'` : 'All caches cleared'
    });
  });

  // HuggingFace Statistics
  app.get('/api/huggingface/statistics', (req: Request, res: Response) => {
    const totalUsage = huggingFaceModels.reduce((sum, model) => sum + model.usage_count, 0);
    const modelTypes = huggingFaceModels.reduce((acc, model) => {
      acc[model.model_type] = (acc[model.model_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostUsed = huggingFaceModels.reduce((prev, current) => 
      current.usage_count > prev.usage_count ? current : prev, 
      huggingFaceModels[0] || { model_id: '', name: '', usage_count: 0 }
    );

    res.json({
      success: true,
      statistics: {
        total_models: huggingFaceModels.length,
        total_usage: totalUsage,
        model_types: modelTypes,
        last_updated: new Date().toISOString(),
        most_used: {
          model_id: mostUsed.model_id,
          name: mostUsed.name,
          usage_count: mostUsed.usage_count
        }
      }
    });
  });

  app.get('/api/huggingface/model-types', (req: Request, res: Response) => {
    const types = huggingFaceModels
      .map(model => model.model_type)
      .filter((type, index, array) => array.indexOf(type) === index);
    res.json({
      success: true,
      model_types: types
    });
  });

  app.get('/api/huggingface/dependencies', (req: Request, res: Response) => {
    res.json({
      success: true,
      dependencies: {
        transformers: true,
        torch: true,
        cuda_available: true
      }
    });
  });

  return httpServer;
}