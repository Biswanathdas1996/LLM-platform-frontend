import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Trash2, Search, Download, AlertCircle, Globe, Server, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiError } from '@/components/ui/api-error';
import { useExternalLogs } from '@/hooks/useLocalAPI';
import { ExternalLogEntry } from '@/lib/api';

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

interface LogStats {
  total_logs: number;
  error_count: number;
  request_count: number;
  response_count: number;
  avg_response_time?: number;
}

export default function LiveLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<LogStats>({
    total_logs: 0,
    error_count: 0,
    request_count: 0,
    response_count: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('internal');

  // External logs from LLM API
  const { data: externalLogsData, error: externalLogsError, isLoading: externalLogsLoading, refetch: refetchExternalLogs } = useExternalLogs();

  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Load recent logs on page load
  useEffect(() => {
    loadRecentLogs();
  }, []);

  // Filter logs when filters change
  useEffect(() => {
    let filtered = logs;

    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(log => log.type === typeFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.endpoint && log.endpoint.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.module && log.module.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredLogs(filtered);
  }, [logs, levelFilter, typeFilter, searchTerm]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll]);

  const loadRecentLogs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/logs/recent?lines=100');
      if (!response.ok) {
        throw new Error(`Failed to load logs: ${response.status}`);
      }
      
      const data = await response.json();
      setLogs(data);
      
      // Update stats
      const newStats: LogStats = {
        total_logs: data.length,
        error_count: data.filter((log: LogEntry) => log.level === 'ERROR').length,
        request_count: data.filter((log: LogEntry) => log.type === 'request').length,
        response_count: data.filter((log: LogEntry) => log.type === 'response').length,
        avg_response_time: calculateAverageResponseTime(data)
      };
      setStats(newStats);
    } catch (err) {
      console.error('Failed to load recent logs:', err);
      setError('Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAverageResponseTime = (logs: LogEntry[]): number => {
    const responseLogs = logs.filter(log => log.type === 'response' && log.duration_ms);
    if (responseLogs.length === 0) return 0;
    
    const total = responseLogs.reduce((sum, log) => sum + (log.duration_ms || 0), 0);
    return total / responseLogs.length;
  };

  const connectToSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    console.log('Attempting to connect to SSE stream...');
    const eventSource = new EventSource('/api/v1/logs/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = (event) => {
      console.log('SSE connection opened:', event);
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const logEntry: LogEntry = JSON.parse(event.data);
        console.log('SSE message received:', event.data);
        
        setLogs(prevLogs => {
          const newLogs = [...prevLogs, logEntry];
          // Keep only last 1000 logs to prevent memory issues
          return newLogs.slice(-1000);
        });

        // Update stats
        setStats(prevStats => ({
          ...prevStats,
          total_logs: prevStats.total_logs + 1,
          error_count: prevStats.error_count + (logEntry.level === 'ERROR' ? 1 : 0),
          request_count: prevStats.request_count + (logEntry.type === 'request' ? 1 : 0),
          response_count: prevStats.response_count + (logEntry.type === 'response' ? 1 : 0),
        }));
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    eventSource.onerror = (event) => {
      console.error('SSE connection error:', event);
      setIsConnected(false);
      setError('Connection lost. Click Connect to retry.');
    };
  };

  const disconnectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  };

  const clearLogs = () => {
    setLogs([]);
    setStats({
      total_logs: 0,
      error_count: 0,
      request_count: 0,
      response_count: 0,
    });
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'bg-red-500 text-white';
      case 'WARN': return 'bg-yellow-500 text-white';
      case 'INFO': return 'bg-blue-500 text-white';
      case 'DEBUG': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeColor = (type: string | undefined) => {
    if (!type) return 'bg-gray-500 text-white';
    switch (type) {
      case 'request': return 'bg-green-500 text-white';
      case 'response': return 'bg-purple-500 text-white';
      case 'endpoint_execution': return 'bg-orange-500 text-white';
      case 'custom_event': return 'bg-cyan-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const renderExternalLogEntry = (log: ExternalLogEntry, index: number) => (
    <div key={index} className="mb-2 border-b border-gray-800 pb-2">
      <div className="flex items-start gap-2">
        <span className="text-gray-400 text-xs shrink-0 w-20">
          {formatTimestamp(log.timestamp)}
        </span>
        <Badge className={`text-xs shrink-0 ${getLevelColor(log.level)}`}>
          {log.level}
        </Badge>
        {log.type && (
          <Badge className={`text-xs shrink-0 ${getTypeColor(log.type)}`}>
            {log.type}
          </Badge>
        )}
        <span className="flex-1">{log.message}</span>
      </div>
      
      {/* Additional details for API calls */}
      <div className="ml-24 mt-1 text-xs text-gray-400">
        <div className="flex gap-4">
          {log.method && <span>{log.method}</span>}
          {log.endpoint && <span>{log.endpoint}</span>}
          {log.status_code && (
            <span className={log.status_code >= 400 ? 'text-red-400' : 'text-green-400'}>
              {log.status_code}
            </span>
          )}
          {log.duration_ms && <span>{log.duration_ms.toFixed(1)}ms</span>}
          {log.duration_s && <span>{(log.duration_s * 1000).toFixed(1)}ms</span>}
        </div>
        {log.url && (
          <div className="text-gray-500 truncate max-w-md">
            {log.url}
          </div>
        )}
        {log.remote_addr && (
          <div className="text-gray-500">
            From: {log.remote_addr}
          </div>
        )}
      </div>
    </div>
  );

  const renderInternalLogEntry = (log: LogEntry, index: number) => (
    <div key={index} className="mb-2 border-b border-gray-800 pb-2">
      <div className="flex items-start gap-2">
        <span className="text-gray-400 text-xs shrink-0 w-20">
          {formatTimestamp(log.timestamp)}
        </span>
        <Badge className={`text-xs shrink-0 ${getLevelColor(log.level)}`}>
          {log.level}
        </Badge>
        {log.type && (
          <Badge className={`text-xs shrink-0 ${getTypeColor(log.type)}`}>
            {log.type}
          </Badge>
        )}
        <span className="flex-1">{log.message}</span>
      </div>
      
      {/* Additional details for API calls */}
      {(log.type === 'request' || log.type === 'response') && (
        <div className="ml-24 mt-1 text-xs text-gray-400">
          <div className="flex gap-4">
            {log.method && <span>{log.method}</span>}
            {log.endpoint && <span>{log.endpoint}</span>}
            {log.status_code && (
              <span className={log.status_code >= 400 ? 'text-red-400' : 'text-green-400'}>
                {log.status_code}
              </span>
            )}
            {log.duration_ms && <span>{log.duration_ms.toFixed(1)}ms</span>}
          </div>
          {log.url && (
            <div className="text-gray-500 truncate max-w-md">
              {log.url}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const getExternalStats = () => {
    if (!externalLogsData) return { total: 0, api_logs: 0, error_logs: 0 };
    
    return {
      total: externalLogsData.api_logs.length + externalLogsData.error_logs.length,
      api_logs: externalLogsData.api_logs.length,
      error_logs: externalLogsData.error_logs.length
    };
  };

  const externalStats = getExternalStats();
  const allExternalLogs = externalLogsData ? [...externalLogsData.api_logs, ...externalLogsData.error_logs] : [];
  const filteredExternalLogs = allExternalLogs
    .filter(log => levelFilter === 'all' || log.level === levelFilter)
    .filter(log => typeFilter === 'all' || log.type === typeFilter)
    .filter(log => !searchTerm || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.endpoint.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Live Logs</h1>
          <p className="text-gray-600 mt-1">Real-time monitoring and log analysis</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="internal" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Internal Logs ({stats.total_logs})
          </TabsTrigger>
          <TabsTrigger value="external" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            LLM API Logs ({externalStats.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="internal" className="space-y-6">
          {/* Statistics Cards for Internal Logs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Logs</p>
                    <p className="text-2xl font-bold">{stats.total_logs}</p>
                  </div>
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">ALL</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Errors</p>
                    <p className="text-2xl font-bold text-red-600">{stats.error_count}</p>
                  </div>
                  <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Requests</p>
                    <p className="text-2xl font-bold text-green-600">{stats.request_count}</p>
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
                    <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.avg_response_time ? `${stats.avg_response_time.toFixed(1)}ms` : 'N/A'}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">MS</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls for Internal Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Log Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="auto-scroll">Auto-scroll</Label>
                  <Switch
                    id="auto-scroll"
                    checked={autoScroll}
                    onCheckedChange={setAutoScroll}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Search className="h-4 w-4 text-gray-400" />
                </div>

                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="INFO">INFO</SelectItem>
                    <SelectItem value="WARN">WARN</SelectItem>
                    <SelectItem value="ERROR">ERROR</SelectItem>
                    <SelectItem value="DEBUG">DEBUG</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="request">Request</SelectItem>
                    <SelectItem value="response">Response</SelectItem>
                    <SelectItem value="custom_event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={isConnected ? disconnectSSE : connectToSSE}
                  variant={isConnected ? "destructive" : "default"}
                >
                  {isConnected ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isConnected ? 'Disconnect' : 'Connect'}
                </Button>

                <Button variant="outline" onClick={exportLogs}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>

                <Button variant="outline" onClick={clearLogs}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>

                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/v1/logs/test', { method: 'POST' });
                      if (response.ok) {
                        console.log('Test logs generated successfully');
                      }
                    } catch (err) {
                      console.error('Failed to generate test logs:', err);
                    }
                  }}
                >
                  Generate Test Logs
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Internal Logs Display */}
          <Card>
            <CardHeader>
              <CardTitle>
                Internal Log Stream 
                {filteredLogs.length !== logs.length && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({filteredLogs.length} of {logs.length} shown)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-96 overflow-y-auto">
                  {filteredLogs.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                      {logs.length === 0 ? 'No logs available' : 'No logs match current filters'}
                    </div>
                  ) : (
                    filteredLogs.map((log, index) => renderInternalLogEntry(log, index))
                  )}
                  <div ref={logsEndRef} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="external" className="space-y-6">
          {/* Statistics Cards for External Logs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total API Logs</p>
                    <p className="text-2xl font-bold">{externalStats.total}</p>
                  </div>
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Globe className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">API Calls</p>
                    <p className="text-2xl font-bold text-green-600">{externalStats.api_logs}</p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xs font-bold">API</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Error Logs</p>
                    <p className="text-2xl font-bold text-red-600">{externalStats.error_logs}</p>
                  </div>
                  <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* External API Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                LLM API Log Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search API logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Search className="h-4 w-4 text-gray-400" />
                </div>

                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="INFO">INFO</SelectItem>
                    <SelectItem value="WARN">WARN</SelectItem>
                    <SelectItem value="ERROR">ERROR</SelectItem>
                    <SelectItem value="DEBUG">DEBUG</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="request">Request</SelectItem>
                    <SelectItem value="response">Response</SelectItem>
                    <SelectItem value="endpoint_execution">Execution</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => refetchExternalLogs()}
                  disabled={externalLogsLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${externalLogsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    const dataStr = JSON.stringify(filteredExternalLogs, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `external_logs_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* External Logs Display */}
          <Card>
            <CardHeader>
              <CardTitle>
                LLM API Log Stream
                {filteredExternalLogs.length !== allExternalLogs.length && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({filteredExternalLogs.length} of {allExternalLogs.length} shown)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {externalLogsError ? (
                <ApiError
                  error={externalLogsError}
                  onRetry={() => refetchExternalLogs()}
                  title="External API Connection Error"
                />
              ) : externalLogsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-96 overflow-y-auto">
                  {filteredExternalLogs.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                      {allExternalLogs.length === 0 ? 'No external logs available' : 'No logs match current filters'}
                    </div>
                  ) : (
                    filteredExternalLogs.map((log, index) => renderExternalLogEntry(log, index))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="fixed bottom-4 right-4 max-w-sm">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}