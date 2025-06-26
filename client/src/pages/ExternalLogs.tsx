import { useState, useEffect } from 'react';
import { RefreshCw, Download, AlertCircle, Server, Bug, Search, Filter, TrendingUp, Activity, Clock, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiError } from '@/components/ui/api-error';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';

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
  response_time?: number;
  duration_ms?: number;
  content_type?: string;
  content_length?: number;
  response_body?: any;
  request_body?: any;
  error_type?: string;
  error_details?: string;
  stack_trace?: string;
}

interface LogsResponse {
  api_logs: LogEntry[];
  error_logs: LogEntry[];
}

export default function ExternalLogs() {
  const [logsData, setLogsData] = useState<LogsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  const [activeTab, setActiveTab] = useState('analytics');

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://127.0.0.1:5000/api/v1/logs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: LogsResponse = await response.json();
      setLogsData(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return 'bg-red-500 text-white';
      case 'CRITICAL': return 'bg-red-700 text-white';
      case 'WARNING': return 'bg-yellow-500 text-white';
      case 'WARN': return 'bg-yellow-500 text-white';
      case 'INFO': return 'bg-blue-500 text-white';
      case 'DEBUG': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'text-green-600';
    if (statusCode >= 300 && statusCode < 400) return 'text-yellow-600';
    if (statusCode >= 400 && statusCode < 500) return 'text-orange-600';
    if (statusCode >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  const filterLogs = (logs: LogEntry[]) => {
    return logs.filter(log => {
      const matchesSearch = !searchTerm || 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.endpoint && log.endpoint.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.request_id && log.request_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.url && log.url.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.method && log.method.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesLevel = levelFilter === 'all' || log.level.toUpperCase() === levelFilter.toUpperCase();
      const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
      
      return matchesSearch && matchesLevel && matchesModule;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getUniqueModules = () => {
    if (!logsData) return [];
    const allLogs = [...logsData.api_logs, ...logsData.error_logs];
    return Array.from(new Set(allLogs.map(log => log.module))).sort();
  };



  const exportLogs = (logType: 'api' | 'error' | 'all') => {
    if (!logsData) return;

    let dataToExport;
    let filename;

    switch (logType) {
      case 'api':
        dataToExport = filterLogs(logsData.api_logs);
        filename = `api_logs_${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'error':
        dataToExport = filterLogs(logsData.error_logs);
        filename = `error_logs_${new Date().toISOString().split('T')[0]}.json`;
        break;
      default:
        dataToExport = {
          api_logs: filterLogs(logsData.api_logs),
          error_logs: filterLogs(logsData.error_logs)
        };
        filename = `all_logs_${new Date().toISOString().split('T')[0]}.json`;
    }

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderLogEntry = (log: LogEntry, index: number, isError = false) => (
    <div key={index} className="mb-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex items-start gap-3 mb-2">
        <span className="text-gray-400 text-xs shrink-0 w-32 font-mono">
          {formatTimestamp(log.timestamp)}
        </span>
        <Badge className={`text-xs shrink-0 ${getLevelColor(log.level)}`}>
          {log.level}
        </Badge>
        <Badge variant="outline" className="text-xs shrink-0 bg-blue-900/30 border-blue-400 text-blue-200 font-medium">
          {log.module}
        </Badge>
        {log.request_id && (
          <span className="text-xs text-blue-400 font-mono">
            {log.request_id}
          </span>
        )}
      </div>
      
      <div className="text-sm text-green-400 mb-2">{log.message}</div>
      
      {/* API Log Details */}
      {!isError && (log.method || log.endpoint || log.status_code) && (
        <div className="ml-3 text-xs text-gray-400 space-y-1">
          {log.method && log.url && (
            <div className="flex gap-2">
              <span className="text-cyan-400 font-semibold">{log.method}</span>
              <span className="text-gray-300 break-all">{log.url}</span>
            </div>
          )}
          {log.endpoint && (
            <div>Endpoint: <span className="text-yellow-400">{log.endpoint}</span></div>
          )}
          
          {/* Primary Request Details */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-1">
            {log.status_code && (
              <div className="bg-gray-800 px-2 py-1 rounded text-xs">
                <span className="text-gray-400">Status:</span>
                <span className={`ml-1 font-semibold ${getStatusColor(log.status_code)}`}>
                  {log.status_code}
                </span>
              </div>
            )}
            
            {(log.duration_ms || log.response_time) && (
              <div className="bg-gray-800 px-2 py-1 rounded text-xs">
                <span className="text-gray-400">Duration:</span>
                <span className="ml-1 font-semibold text-blue-400">
                  {log.duration_ms ? `${log.duration_ms.toFixed(2)}ms` : `${log.response_time?.toFixed(2)}ms`}
                </span>
              </div>
            )}
            
            {log.content_type && (
              <div className="bg-gray-800 px-2 py-1 rounded text-xs">
                <span className="text-gray-400">Content-Type:</span>
                <span className="ml-1 font-semibold text-green-400">
                  {log.content_type}
                </span>
              </div>
            )}
            
            {log.content_length && (
              <div className="bg-gray-800 px-2 py-1 rounded text-xs">
                <span className="text-gray-400">Size:</span>
                <span className="ml-1 font-semibold text-orange-400">
                  {log.content_length} bytes
                </span>
              </div>
            )}
            
            {log.remote_addr && (
              <div className="bg-gray-800 px-2 py-1 rounded text-xs">
                <span className="text-gray-400">From:</span>
                <span className="ml-1 font-semibold text-purple-400">
                  {log.remote_addr}
                </span>
              </div>
            )}
          </div>
          
          {/* Response Body - Always Visible When Available */}
          {log.response_body && (
            <div className="mt-2">
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-green-400 font-semibold text-xs mb-2">Response Body:</div>
                <pre className="bg-green-900/20 p-2 rounded text-green-200 overflow-x-auto text-xs max-h-32 overflow-y-auto">
                  {typeof log.response_body === 'string' 
                    ? log.response_body 
                    : JSON.stringify(log.response_body, null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          {/* Request Body - Collapsible */}
          {log.request_body && (
            <div className="mt-2">
              <details className="text-cyan-300">
                <summary className="cursor-pointer font-semibold text-xs bg-gray-800 p-2 rounded">Request Body</summary>
                <pre className="bg-cyan-900/20 p-2 rounded text-cyan-200 mt-1 overflow-x-auto text-xs max-h-32 overflow-y-auto">
                  {typeof log.request_body === 'string' 
                    ? log.request_body 
                    : JSON.stringify(log.request_body, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
      
      {/* Error Log Details */}
      {isError && (
        <div className="ml-3 text-xs text-gray-400 space-y-2">
          {log.error_type && (
            <div>Error Type: <span className="text-red-400">{log.error_type}</span></div>
          )}
          {log.error_details && (
            <div className="text-red-300">
              <div className="font-semibold">Details:</div>
              <div className="bg-red-900/20 p-2 rounded text-red-200 mt-1">
                {log.error_details}
              </div>
            </div>
          )}
          {log.stack_trace && (
            <details className="text-red-300">
              <summary className="cursor-pointer font-semibold">Stack Trace</summary>
              <pre className="bg-red-900/20 p-2 rounded text-red-200 mt-1 overflow-x-auto text-xs">
                {log.stack_trace}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );

  const getStats = () => {
    if (!logsData) return { total: 0, api: 0, errors: 0, requests: 0, responses: 0 };
    
    const apiLogs = logsData.api_logs;
    const errorLogs = logsData.error_logs;
    
    return {
      total: apiLogs.length + errorLogs.length,
      api: apiLogs.length,
      errors: errorLogs.length,
      requests: apiLogs.filter(log => log.message.toLowerCase().includes('incoming')).length,
      responses: apiLogs.filter(log => log.message.toLowerCase().includes('completed')).length,
    };
  };

  // Analytics data processing functions
  const getTimeSeriesData = () => {
    if (!logsData) return [];
    
    const allLogs = [...logsData.api_logs, ...logsData.error_logs];
    const groupedByHour = allLogs.reduce((acc, log) => {
      const hour = new Date(log.timestamp).toISOString().slice(0, 13) + ':00:00';
      if (!acc[hour]) {
        acc[hour] = { time: hour, requests: 0, errors: 0, total: 0 };
      }
      acc[hour].total++;
      if (log.level === 'ERROR') {
        acc[hour].errors++;
      } else {
        acc[hour].requests++;
      }
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(groupedByHour).sort((a: any, b: any) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    ).slice(-24); // Last 24 hours
  };

  const getResponseTimeData = () => {
    if (!logsData) return [];
    
    return logsData.api_logs
      .filter(log => log.duration_ms && log.duration_ms > 0)
      .map((log, index) => ({
        index: index + 1,
        responseTime: log.duration_ms,
        endpoint: log.endpoint || 'unknown',
        timestamp: new Date(log.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })
      }))
      .slice(-50); // Last 50 requests
  };

  const getStatusCodeDistribution = () => {
    if (!logsData) return [];
    
    const statusCodes = logsData.api_logs.reduce((acc, log) => {
      if (log.status_code) {
        const code = log.status_code.toString();
        acc[code] = (acc[code] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const colors = {
      '200': '#10b981', // green
      '201': '#059669', // darker green
      '400': '#f59e0b', // amber
      '401': '#ef4444', // red
      '403': '#dc2626', // darker red
      '404': '#f97316', // orange
      '500': '#7c2d12', // dark red
    };
    
    return Object.entries(statusCodes).map(([code, count]) => ({
      name: `${code}`,
      value: count,
      fill: colors[code as keyof typeof colors] || '#6b7280'
    }));
  };

  const getEndpointPerformance = () => {
    if (!logsData) return [];
    
    const endpointStats = logsData.api_logs.reduce((acc, log) => {
      if (log.endpoint && log.duration_ms) {
        if (!acc[log.endpoint]) {
          acc[log.endpoint] = { 
            endpoint: log.endpoint, 
            totalTime: 0, 
            count: 0, 
            maxTime: 0,
            minTime: Infinity 
          };
        }
        acc[log.endpoint].totalTime += log.duration_ms;
        acc[log.endpoint].count++;
        acc[log.endpoint].maxTime = Math.max(acc[log.endpoint].maxTime, log.duration_ms);
        acc[log.endpoint].minTime = Math.min(acc[log.endpoint].minTime, log.duration_ms);
      }
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(endpointStats)
      .map((stat: any) => ({
        ...stat,
        avgTime: stat.totalTime / stat.count,
        minTime: stat.minTime === Infinity ? 0 : stat.minTime
      }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10); // Top 10 endpoints
  };

  const getMethodDistribution = () => {
    if (!logsData) return [];
    
    const methods = logsData.api_logs.reduce((acc, log) => {
      if (log.method) {
        acc[log.method] = (acc[log.method] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    
    return Object.entries(methods).map(([method, count], index) => ({
      name: method,
      value: count,
      fill: colors[index % colors.length]
    }));
  };

  const stats = getStats();
  const filteredApiLogs = logsData ? filterLogs(logsData.api_logs) : [];
  const filteredErrorLogs = logsData ? filterLogs(logsData.error_logs) : [];

  if (error) {
    return (
      <div className="p-6">
        <ApiError
          error={new Error(error)}
          onRetry={fetchLogs}
          title="Failed to Connect to Local LLM API"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">External LLM API Logs</h1>
          <p className="text-gray-600 mt-1">Monitor Local LLM API activity and errors</p>
          {lastRefresh && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastRefresh.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })}
            </p>
          )}
        </div>
        <Button onClick={fetchLogs} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Server className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Logs</p>
                <p className="text-2xl font-bold text-blue-600">{stats.api}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">API</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
              </div>
              <Bug className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Requests</p>
                <p className="text-2xl font-bold text-green-600">{stats.requests}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs font-bold">REQ</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Responses</p>
                <p className="text-2xl font-bold text-purple-600">{stats.responses}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-xs font-bold">RES</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Log Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs, request IDs, endpoints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Log Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">INFO</SelectItem>
                <SelectItem value="warning">WARNING</SelectItem>
                <SelectItem value="error">ERROR</SelectItem>
                <SelectItem value="critical">CRITICAL</SelectItem>
                <SelectItem value="debug">DEBUG</SelectItem>
              </SelectContent>
            </Select>

            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {getUniqueModules().map(module => (
                  <SelectItem key={module} value={module}>{module}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchLogs} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Logs
            </Button>
            <Button variant="outline" onClick={() => exportLogs('all')}>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
            <Button variant="outline" onClick={() => exportLogs('api')}>
              Export API Logs
            </Button>
            <Button variant="outline" onClick={() => exportLogs('error')}>
              Export Error Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Display */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            API Logs ({filteredApiLogs.length})
          </TabsTrigger>
          <TabsTrigger value="error" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Error Logs ({filteredErrorLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Request Volume Over Time */}
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Request Volume Over Time (Last 24 Hours)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={getTimeSeriesData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9ca3af"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString('en-IN', { 
                        timeZone: 'Asia/Kolkata', 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false 
                      })}
                    />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f9fafb'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleString('en-IN', { 
                        timeZone: 'Asia/Kolkata'
                      })}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Successful Requests"
                    />
                    <Area
                      type="monotone"
                      dataKey="errors"
                      stackId="1"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                      name="Errors"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Response Time Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  Response Time Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={getResponseTimeData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#9ca3af"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f9fafb'
                      }}
                      formatter={(value, name) => [`${value}ms`, 'Response Time']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="responseTime" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', r: 3 }}
                      activeDot={{ r: 5, fill: '#a855f7' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Code Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  HTTP Status Codes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={getStatusCodeDistribution()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                      labelLine={false}
                    >
                      {getStatusCodeDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f9fafb'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* HTTP Methods Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-500" />
                  HTTP Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getMethodDistribution()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f9fafb'
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {getMethodDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Endpoint Performance Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  Top Endpoint Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getEndpointPerformance()} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis 
                      dataKey="endpoint" 
                      type="category" 
                      stroke="#9ca3af"
                      tick={{ fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f9fafb'
                      }}
                      formatter={(value, name) => {
                        if (name === 'avgTime') return [`${Number(value).toFixed(2)}ms`, 'Avg Response Time'];
                        if (name === 'count') return [value, 'Request Count'];
                        return [value, name];
                      }}
                    />
                    <Bar dataKey="avgTime" fill="#f59e0b" radius={[0, 4, 4, 0]} name="avgTime" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Endpoint Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-2 text-gray-400">Endpoint</th>
                      <th className="text-right p-2 text-gray-400">Requests</th>
                      <th className="text-right p-2 text-gray-400">Avg Time (ms)</th>
                      <th className="text-right p-2 text-gray-400">Min Time (ms)</th>
                      <th className="text-right p-2 text-gray-400">Max Time (ms)</th>
                      <th className="text-right p-2 text-gray-400">Total Time (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getEndpointPerformance().map((endpoint, index) => (
                      <tr key={index} className="border-b border-gray-800 hover:bg-gray-900/50">
                        <td className="p-2 font-mono text-blue-400">{endpoint.endpoint}</td>
                        <td className="p-2 text-right text-green-400">{endpoint.count}</td>
                        <td className="p-2 text-right text-yellow-400">{endpoint.avgTime.toFixed(2)}</td>
                        <td className="p-2 text-right text-gray-300">{endpoint.minTime.toFixed(2)}</td>
                        <td className="p-2 text-right text-red-400">{endpoint.maxTime.toFixed(2)}</td>
                        <td className="p-2 text-right text-purple-400">{endpoint.totalTime.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-96 overflow-y-auto">
                  {filteredApiLogs.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                      No API logs available
                    </div>
                  ) : (
                    filteredApiLogs.map((log, index) => renderLogEntry(log, index))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="error" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-96 overflow-y-auto">
                  {filteredErrorLogs.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                      No error logs available
                    </div>
                  ) : (
                    filteredErrorLogs.map((log, index) => renderLogEntry(log, index, true))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}