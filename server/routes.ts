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



  return httpServer;
}