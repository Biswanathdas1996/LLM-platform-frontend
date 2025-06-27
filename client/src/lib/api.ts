const API_BASE_URL = "http://127.0.0.1:5001/api/v1";

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
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Local LLM API is not running. Please start the LLM service on port 5000."
        );
      }
      throw error;
    }
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/health");
  }

  async getModels(): Promise<ModelsResponse> {
    return this.request<ModelsResponse>("/models");
  }

  async uploadModel(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/models`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload Error: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Local LLM API is not running. Please start the LLM service on port 5000."
        );
      }
      throw error;
    }
  }

  async deleteModel(modelName: string): Promise<any> {
    return this.request(`/models/${modelName}`, {
      method: "DELETE",
    });
  }

  async syncModels(): Promise<any> {
    return this.request("/models/sync", {
      method: "POST",
    });
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    return this.request<GenerateResponse>("/generate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async clearCache(): Promise<any> {
    return this.request("/cache/clear", {
      method: "POST",
    });
  }

  async getCacheStatus(): Promise<CacheStatusResponse> {
    return this.request<CacheStatusResponse>("/cache/status");
  }

  async getLogs(): Promise<ExternalLogsResponse> {
    // Generate comprehensive mock data for analytics visualization
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = Date.now();
        const api_logs: ExternalLogEntry[] = [];
        const error_logs: ExternalLogEntry[] = [];

        // Generate logs for the last 7 days with realistic patterns
        for (let day = 0; day < 7; day++) {
          const dayStart = now - day * 24 * 60 * 60 * 1000;

          // Generate hourly logs with varying intensity
          for (let hour = 0; hour < 24; hour++) {
            const hourStart = dayStart - hour * 60 * 60 * 1000;

            // Peak hours: 9-11 AM and 2-4 PM (more requests)
            const isPeakHour =
              (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16);
            const baseRequestCount = isPeakHour ? 15 : 5;
            const requestCount =
              Math.floor(Math.random() * baseRequestCount) + 3;

            for (let req = 0; req < requestCount; req++) {
              const requestTime = hourStart - Math.random() * 60 * 60 * 1000;
              const requestId = `req_${requestTime}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;

              // Randomly select endpoint type
              const endpoints = [
                {
                  name: "api.health_check",
                  method: "GET",
                  path: "/api/v1/health",
                  avgTime: 15,
                  errorRate: 0.01,
                },
                {
                  name: "api.list_models",
                  method: "GET",
                  path: "/api/v1/models",
                  avgTime: 35,
                  errorRate: 0.02,
                },
                {
                  name: "api.generate",
                  method: "POST",
                  path: "/api/v1/generate",
                  avgTime: 2500,
                  errorRate: 0.05,
                },
                {
                  name: "api.upload_model",
                  method: "POST",
                  path: "/api/v1/models/upload",
                  avgTime: 15000,
                  errorRate: 0.1,
                },
                {
                  name: "api.delete_model",
                  method: "DELETE",
                  path: "/api/v1/models/delete",
                  avgTime: 500,
                  errorRate: 0.03,
                },
                {
                  name: "api.cache_status",
                  method: "GET",
                  path: "/api/v1/cache/status",
                  avgTime: 25,
                  errorRate: 0.01,
                },
                {
                  name: "api.clear_cache",
                  method: "POST",
                  path: "/api/v1/cache/clear",
                  avgTime: 800,
                  errorRate: 0.02,
                },
                {
                  name: "api.sync_models",
                  method: "POST",
                  path: "/api/v1/models/sync",
                  avgTime: 1200,
                  errorRate: 0.04,
                },
              ];

              const endpoint =
                endpoints[Math.floor(Math.random() * endpoints.length)];
              const isError = Math.random() < endpoint.errorRate;

              // Generate response time with some variance
              const responseTime =
                endpoint.avgTime +
                (Math.random() - 0.5) * endpoint.avgTime * 0.4;

              // Request log
              const requestLog: ExternalLogEntry = {
                args:
                  endpoint.method === "POST"
                    ? { model: `model_${Math.floor(Math.random() * 5)}` }
                    : {},
                content_length:
                  endpoint.method === "POST"
                    ? Math.floor(Math.random() * 1000) + 100
                    : null,
                content_type:
                  endpoint.method === "POST" ? "application/json" : null,
                endpoint: endpoint.name,
                level: "INFO",
                message: `Incoming ${endpoint.method} request`,
                method: endpoint.method,
                module: "api_logger",
                remote_addr: `192.168.1.${Math.floor(Math.random() * 255)}`,
                request_id: requestId,
                timestamp: new Date(requestTime).toISOString(),
                type: "request",
                url: `http://127.0.0.1:5001${endpoint.path}`,
                user_agent: [
                  "Mozilla/5.0 (compatible; LLM-Platform/1.0)",
                  "curl/7.68.0",
                  "Python/3.9 requests/2.28.1",
                  "Node.js/18.0.0",
                ][Math.floor(Math.random() * 4)],
              };

              api_logs.push(requestLog);

              // Response log (if not error) or error log
              if (isError) {
                const errorMessages = [
                  "Model upload failed: insufficient disk space",
                  "Authentication failed: invalid API key",
                  "Rate limit exceeded: too many requests",
                  "Model not found: specified model does not exist",
                  "Generation timeout: model took too long to respond",
                  "Invalid request format: missing required parameters",
                  "Cache corruption detected: rebuilding cache",
                  "Network timeout: external service unavailable",
                ];

                const errorLog: ExternalLogEntry = {
                  endpoint: endpoint.name,
                  level: "ERROR",
                  message:
                    errorMessages[
                      Math.floor(Math.random() * errorMessages.length)
                    ],
                  method: endpoint.method,
                  module: "error_handler",
                  remote_addr: requestLog.remote_addr,
                  request_id: requestId,
                  timestamp: new Date(requestTime + responseTime).toISOString(),
                  type: "response",
                  url: requestLog.url,
                  user_agent: requestLog.user_agent,
                  status_code: [400, 401, 403, 404, 429, 500, 502, 503][
                    Math.floor(Math.random() * 8)
                  ],
                  duration_ms: responseTime,
                };

                error_logs.push(errorLog);
              } else {
                const responseLog: ExternalLogEntry = {
                  content_length: Math.floor(Math.random() * 5000) + 50,
                  content_type: "application/json",
                  duration_ms: responseTime,
                  endpoint: endpoint.name,
                  level: "INFO",
                  message: `${endpoint.method} request completed successfully`,
                  method: endpoint.method,
                  module: "api_logger",
                  request_id: requestId,
                  status_code: [200, 201, 202][Math.floor(Math.random() * 3)],
                  timestamp: new Date(requestTime + responseTime).toISOString(),
                  type: "response",
                  url: requestLog.url,
                };

                api_logs.push(responseLog);
              }

              // Add endpoint execution logs for some requests
              if (Math.random() < 0.3) {
                const executionLog: ExternalLogEntry = {
                  duration_s: responseTime / 1000,
                  endpoint: endpoint.name.replace("api.", ""),
                  level: "INFO",
                  message: `Endpoint ${endpoint.name.replace(
                    "api.",
                    ""
                  )} completed in ${(responseTime / 1000).toFixed(3)}s`,
                  module: "execution_tracker",
                  status: isError ? "error" : "success",
                  timestamp: new Date(
                    requestTime + responseTime - 10
                  ).toISOString(),
                  type: "endpoint_execution",
                  request_id: requestId,
                };

                api_logs.push(executionLog);
              }
            }
          }
        }

        // Sort logs by timestamp (newest first)
        api_logs.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        error_logs.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        resolve({
          api_logs: api_logs.slice(0, 1000), // Limit to 1000 entries for performance
          error_logs: error_logs.slice(0, 200), // Limit to 200 error entries
        });
      }, 800); // Simulate realistic network delay
    });
  }
}

export const api = new LocalLLMAPI();
