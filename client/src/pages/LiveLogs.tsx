import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Trash2, Search, Download, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/components/ui/api-error';

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
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(term) ||
        log.endpoint?.toLowerCase().includes(term) ||
        log.url?.toLowerCase().includes(term)
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

  // Update stats when logs change
  useEffect(() => {
    const newStats: LogStats = {
      total_logs: logs.length,
      error_count: logs.filter(log => log.level === 'ERROR').length,
      request_count: logs.filter(log => log.type === 'request').length,
      response_count: logs.filter(log => log.type === 'response').length,
    };

    // Calculate average response time
    const responseTimes = logs
      .filter(log => log.type === 'response' && log.duration_ms)
      .map(log => log.duration_ms!);
    
    if (responseTimes.length > 0) {
      newStats.avg_response_time = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    setStats(newStats);
  }, [logs]);

  const loadRecentLogs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/logs/recent?lines=100');
      if (!response.ok) {
        throw new Error(`Failed to load recent logs: ${response.status}`);
      }
      const recentLogs = await response.json();
      setLogs(recentLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recent logs');
    } finally {
      setIsLoading(false);
    }
  };

  const connectToStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setError(null);
    const eventSource = new EventSource('/api/v1/logs/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const logEntry: LogEntry = JSON.parse(event.data);
        setLogs(prev => [...prev, logEntry]);
      } catch (err) {
        console.error('Failed to parse log entry:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError('Connection to log stream failed');
    };
  };

  const disconnectFromStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'WARN': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'INFO': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'DEBUG': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'request': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'response': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'custom_event': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (error && !logs.length) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Live Logs</h1>
        <ApiError 
          error={new Error(error)} 
          onRetry={loadRecentLogs}
          title="Unable to Load Logs"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Logs</h1>
        <div className="flex items-center space-x-4">
          <Badge variant={isConnected ? "default" : "secondary"} className="px-3 py-1">
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total_logs}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Logs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.error_count}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.request_count}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.avg_response_time ? `${stats.avg_response_time.toFixed(1)}ms` : '—'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Response</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <Button
              onClick={isConnected ? disconnectFromStream : connectToStream}
              variant={isConnected ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              {isConnected ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isConnected ? 'Disconnect' : 'Connect'}
            </Button>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto-scroll"
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
              />
              <Label htmlFor="auto-scroll">Auto-scroll</Label>
            </div>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
                <SelectItem value="WARN">WARN</SelectItem>
                <SelectItem value="INFO">INFO</SelectItem>
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
                <SelectItem value="custom_event">Events</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button variant="outline" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button variant="outline" onClick={clearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Display */}
      <Card>
        <CardHeader>
          <CardTitle>
            Log Stream 
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
                filteredLogs.map((log, index) => (
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
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          )}
        </CardContent>
      </Card>

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