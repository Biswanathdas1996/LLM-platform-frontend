import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";

// In-memory log storage for demonstration
interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';
  message: string;
  module?: string;
  type?: 'request' | 'response' | 'custom_event';
  request_id?: string;
  method?: string;
  url?: string;
  endpoint?: string;
  status_code?: number;
  duration_ms?: number;
  remote_addr?: string;
  user_agent?: string;
  content_type?: string;
  content_length?: number;
  response_body?: any;
  request_body?: any;
  error?: string;
}

class LogManager {
  private logs: LogEntry[] = [];
  private subscribers: Set<Response> = new Set();
  private maxLogs = 1000; // Keep last 1000 logs in memory

  addLog(logEntry: LogEntry) {
    this.logs.push(logEntry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Send to SSE subscribers
    this.broadcast(logEntry);
  }

  getRecentLogs(lines?: number, type?: string): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (type && type !== 'all') {
      if (type === 'errors') {
        filteredLogs = this.logs.filter(log => log.level === 'ERROR');
      } else if (type === 'api') {
        filteredLogs = this.logs.filter(log => log.type === 'request' || log.type === 'response');
      }
    }

    const count = lines || 100;
    return filteredLogs.slice(-count);
  }

  getStats(hours = 24): any {
    const now = new Date();
    const cutoff = new Date(now.getTime() - (hours * 60 * 60 * 1000));
    
    const recentLogs = this.logs.filter(log => 
      new Date(log.timestamp) >= cutoff
    );

    const requests = recentLogs.filter(log => log.type === 'request');
    const responses = recentLogs.filter(log => log.type === 'response');
    const errors = recentLogs.filter(log => log.level === 'ERROR');

    const responseTimes = responses
      .filter(log => log.duration_ms)
      .map(log => log.duration_ms!);

    return {
      api_stats: {
        total_requests: requests.length,
        endpoints: this.countBy(requests, 'endpoint'),
        methods: this.countBy(requests, 'method'),
        status_codes: this.countBy(responses, 'status_code'),
        avg_response_time: responseTimes.length > 0 
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
          : 0,
        response_times: responseTimes
      },
      error_summary: {
        total_errors: errors.length,
        error_types: this.countBy(errors, 'error'),
        endpoints_with_errors: this.countBy(errors, 'endpoint'),
        status_codes: this.countBy(errors, 'status_code')
      },
      timeframe_hours: hours
    };
  }

  private countBy(items: LogEntry[], field: keyof LogEntry): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = String(item[field] || 'unknown');
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  addSubscriber(res: Response) {
    this.subscribers.add(res);
    
    res.on('close', () => {
      this.subscribers.delete(res);
    });
  }

  private broadcast(logEntry: LogEntry) {
    const data = `data: ${JSON.stringify(logEntry)}\n\n`;
    
    this.subscribers.forEach(res => {
      try {
        res.write(data);
      } catch (error) {
        this.subscribers.delete(res);
      }
    });
  }
}

const logManager = new LogManager();

// Middleware to log all requests
function requestLogger(req: Request, res: Response, next: Function) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Skip logging for log-related endpoints to avoid infinite loops
  if (req.path.includes('/logs/')) {
    return next();
  }

  // Log incoming request
  logManager.addLog({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: `${req.method} ${req.path}`,
    module: 'express',
    type: 'request',
    request_id: requestId,
    method: req.method,
    url: req.url,
    endpoint: req.path.split('/').pop() || 'unknown',
    remote_addr: req.ip || req.connection.remoteAddress || 'unknown',
    user_agent: req.get('User-Agent') || 'unknown'
  });

  // Log response when request finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logManager.addLog({
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 400 ? 'ERROR' : 'INFO',
      message: `${req.method} ${req.path} - ${res.statusCode}`,
      module: 'express',
      type: 'response',
      request_id: requestId,
      method: req.method,
      url: req.url,
      endpoint: req.path.split('/').pop() || 'unknown',
      status_code: res.statusCode,
      duration_ms: duration
    });
  });

  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // SSE endpoint - must be defined before request logging middleware
  app.get('/api/v1/logs/stream', (req: Request, res: Response) => {
    console.log('SSE connection requested');
    
    // Set SSE headers
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Send initial event
    const initialEvent = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Connected to live log stream',
      type: 'custom_event'
    };
    res.write(`data: ${JSON.stringify(initialEvent)}\n\n`);

    // Add to subscribers
    logManager.addSubscriber(res);

    // Heartbeat interval
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15000);

    // Cleanup on disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      console.log('SSE client disconnected');
    });
  });

  // Add request logging middleware to other routes
  app.use('/api', (req, res, next) => {
    // Skip logging for SSE endpoint
    if (req.path === '/v1/logs/stream') {
      return next();
    }
    requestLogger(req, res, next);
  });

  // External LLM API logs endpoint - using specific route to avoid conflicts
  app.get('/api/v1/logs/external', (req: Request, res: Response) => {
    // Return mock data matching the external API format from the sample
    const mockResponse = {
      api_logs: [
        {
          args: {},
          content_length: null,
          content_type: "application/json",
          endpoint: "api.health_check",
          level: "INFO" as const,
          message: "Incoming request",
          method: "GET",
          module: "logger",
          remote_addr: "127.0.0.1",
          request_id: `req_${Date.now()}_health`,
          timestamp: new Date().toISOString(),
          type: "request" as const,
          url: "http://127.0.0.1:5000/api/v1/health",
          user_agent: "Mozilla/5.0 (compatible; LLM-Platform/1.0)"
        },
        {
          content_length: 41,
          content_type: "application/json",
          duration_ms: 15.23,
          endpoint: "api.health_check",
          level: "INFO" as const,
          message: "Outgoing response",
          method: "GET",
          module: "logger",
          request_id: `req_${Date.now()}_health`,
          status_code: 200,
          timestamp: new Date(Date.now() + 15).toISOString(),
          type: "response" as const,
          url: "http://127.0.0.1:5000/api/v1/health"
        },
        {
          args: {},
          content_length: null,
          content_type: null,
          endpoint: "api.list_models",
          level: "INFO" as const,
          message: "Incoming request",
          method: "GET",
          module: "logger",
          remote_addr: "127.0.0.1",
          request_id: `req_${Date.now()}_models`,
          timestamp: new Date(Date.now() + 100).toISOString(),
          type: "request" as const,
          url: "http://127.0.0.1:5000/api/v1/models",
          user_agent: "Mozilla/5.0 (compatible; LLM-Platform/1.0)"
        },
        {
          duration_s: 0.035,
          endpoint: "list_models",
          level: "INFO" as const,
          message: "Endpoint list_models completed successfully in 0.035s",
          module: "logger",
          status: "success",
          timestamp: new Date(Date.now() + 135).toISOString(),
          type: "endpoint_execution" as const
        }
      ],
      error_logs: []
    };

    res.json(mockResponse);
  });

  // Other Live Logs API endpoints
  app.get('/api/v1/logs/recent', (req: Request, res: Response) => {
    const lines = req.query.lines ? parseInt(req.query.lines as string) : 100;
    const type = req.query.type as string || 'all';
    
    const logs = logManager.getRecentLogs(lines, type);
    res.json(logs);
  });

  app.get('/api/v1/logs/stats', (req: Request, res: Response) => {
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
    const stats = logManager.getStats(hours);
    res.json(stats);
  });

  // Test endpoint to generate sample logs
  app.post('/api/v1/logs/test', (req: Request, res: Response) => {
    const testLogs = [
      { level: 'INFO', message: 'Test log entry generated', type: 'custom_event' },
      { level: 'WARN', message: 'Sample warning message', type: 'custom_event' },
      { level: 'ERROR', message: 'Test error for demonstration', type: 'custom_event' },
      { level: 'DEBUG', message: 'Debug information logged', type: 'custom_event' }
    ];

    testLogs.forEach((log, index) => {
      setTimeout(() => {
        logManager.addLog({
          timestamp: new Date().toISOString(),
          level: log.level as LogEntry['level'],
          message: log.message,
          module: 'test',
          type: log.type as LogEntry['type']
        });
      }, index * 500);
    });

    res.json({ message: 'Test logs generated' });
  });

  // Add some sample logs for demonstration
  setTimeout(() => {
    logManager.addLog({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Live Logs system initialized',
      module: 'logger',
      type: 'custom_event'
    });
  }, 1000);

  const httpServer = createServer(app);

  // Set up WebSocket server for additional real-time features
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    logManager.addLog({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'WebSocket connection established',
      module: 'websocket',
      type: 'custom_event'
    });

    ws.on('close', () => {
      logManager.addLog({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'WebSocket connection closed',
        module: 'websocket',
        type: 'custom_event'
      });
    });
  });

  return httpServer;
}
