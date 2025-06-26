import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Scatter,
  ComposedChart
} from 'recharts';
import { TrendingUp, Activity, Clock, Zap, AlertTriangle, CheckCircle, Filter, BarChart3, Target, Globe } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  module: string;
  request_id?: string;
  method?: string;
  url?: string;
  endpoint?: string;
  status_code?: number;
  duration_ms?: number;
  content_type?: string;
  content_length?: number;
  response_body?: any;
  request_body?: any;
}

interface LogsResponse {
  api_logs: LogEntry[];
  error_logs: LogEntry[];
}

export function DashboardAnalytics() {
  const [logsData, setLogsData] = useState<LogsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/v1/logs');
      if (response.ok) {
        const data: LogsResponse = await response.json();
        setLogsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    const interval = setInterval(fetchAnalyticsData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getTimeRangeInHours = () => {
    switch (timeRange) {
      case '1h': return 1;
      case '6h': return 6;
      case '12h': return 12;
      case '24h': return 24;
      case '7d': return 168;
      default: return 24;
    }
  };

  const filterLogsByTimeRange = (logs: LogEntry[]) => {
    const hours = getTimeRangeInHours();
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return logs.filter(log => new Date(log.timestamp) >= cutoffTime);
  };

  const getPerformanceMetrics = () => {
    if (!logsData) return { 
      avgResponseTime: 0, 
      totalRequests: 0, 
      errorRate: 0, 
      successRate: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      p95ResponseTime: 0,
      throughput: 0
    };
    
    const filteredApiLogs = filterLogsByTimeRange(logsData.api_logs);
    const filteredErrorLogs = filterLogsByTimeRange(logsData.error_logs);
    
    const responseTimes = filteredApiLogs
      .filter(log => log.duration_ms && log.duration_ms > 0)
      .map(log => log.duration_ms!)
      .sort((a, b) => a - b);
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    const minResponseTime = responseTimes.length > 0 ? responseTimes[0] : 0;
    const maxResponseTime = responseTimes.length > 0 ? responseTimes[responseTimes.length - 1] : 0;
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p95ResponseTime = responseTimes.length > 0 ? responseTimes[p95Index] || 0 : 0;
    
    const totalRequests = filteredApiLogs.length;
    const errors = filteredErrorLogs.length;
    const errorRate = totalRequests > 0 ? (errors / (totalRequests + errors)) * 100 : 0;
    const successRate = 100 - errorRate;
    
    const hours = getTimeRangeInHours();
    const throughput = totalRequests / hours; // requests per hour
    
    return { 
      avgResponseTime, 
      totalRequests, 
      errorRate, 
      successRate,
      minResponseTime,
      maxResponseTime,
      p95ResponseTime,
      throughput
    };
  };

  const getTimeSeriesData = () => {
    if (!logsData) return [];
    
    const filteredApiLogs = filterLogsByTimeRange(logsData.api_logs);
    const filteredErrorLogs = filterLogsByTimeRange(logsData.error_logs);
    const allLogs = [...filteredApiLogs, ...filteredErrorLogs];
    
    const hours = getTimeRangeInHours();
    const intervals = Math.min(hours, 24); // Max 24 data points
    const intervalDuration = (hours * 60 * 60 * 1000) / intervals;
    
    const now = new Date();
    const timePoints = [];
    
    for (let i = intervals - 1; i >= 0; i--) {
      const intervalStart = new Date(now.getTime() - (i * intervalDuration));
      intervalStart.setMinutes(0, 0, 0);
      timePoints.push(intervalStart);
    }
    
    return timePoints.map(timePoint => {
      const nextTimePoint = new Date(timePoint.getTime() + intervalDuration);
      const intervalLogs = allLogs.filter(log => {
        const logTime = new Date(log.timestamp);
        return logTime >= timePoint && logTime < nextTimePoint;
      });
      
      const requests = intervalLogs.filter(log => log.level !== 'ERROR');
      const errors = intervalLogs.filter(log => log.level === 'ERROR');
      
      const responseTimes = requests
        .filter(log => log.duration_ms && log.duration_ms > 0)
        .map(log => log.duration_ms!);
      
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;
      
      return {
        time: timePoint.toLocaleTimeString('en-IN', { 
          timeZone: 'Asia/Kolkata', 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        date: timePoint.toLocaleDateString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          month: 'short',
          day: 'numeric'
        }),
        requests: requests.length,
        errors: errors.length,
        avgResponseTime: Math.round(avgResponseTime),
        throughput: requests.length / (intervalDuration / (60 * 60 * 1000)) // per hour
      };
    });
  };

  const getTopEndpoints = () => {
    if (!logsData) return [];
    
    const filteredApiLogs = filterLogsByTimeRange(logsData.api_logs);
    const endpointStats = filteredApiLogs.reduce((acc, log) => {
      if (log.endpoint) {
        if (!acc[log.endpoint]) {
          acc[log.endpoint] = {
            endpoint: log.endpoint,
            count: 0,
            totalDuration: 0,
            errors: 0,
            avgResponseTime: 0
          };
        }
        acc[log.endpoint].count++;
        if (log.duration_ms) {
          acc[log.endpoint].totalDuration += log.duration_ms;
        }
        if (log.status_code && log.status_code >= 400) {
          acc[log.endpoint].errors++;
        }
      }
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(endpointStats)
      .map((stat: any) => ({
        ...stat,
        avgResponseTime: stat.count > 0 ? Math.round(stat.totalDuration / stat.count) : 0,
        errorRate: stat.count > 0 ? Math.round((stat.errors / stat.count) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  const getMethodDistribution = () => {
    if (!logsData) return [];
    
    const filteredApiLogs = filterLogsByTimeRange(logsData.api_logs);
    const methodCounts = filteredApiLogs.reduce((acc, log) => {
      if (log.method) {
        acc[log.method] = (acc[log.method] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(methodCounts).map(([method, count]) => ({
      method,
      count
    }));
  };

  const getResponseTimeDistribution = () => {
    if (!logsData) return [];
    
    const filteredApiLogs = filterLogsByTimeRange(logsData.api_logs);
    const responseTimes = filteredApiLogs
      .filter(log => log.duration_ms && log.duration_ms > 0)
      .map(log => ({ time: log.duration_ms!, endpoint: log.endpoint || 'unknown' }));
    
    return responseTimes.slice(0, 100); // Limit for performance
  };

  const getStatusCodeData = () => {
    if (!logsData) return [];
    
    const filteredApiLogs = filterLogsByTimeRange(logsData.api_logs);
    const statusCodes = filteredApiLogs.reduce((acc, log) => {
      if (log.status_code) {
        const code = log.status_code.toString();
        acc[code] = (acc[code] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const colors = {
      '200': '#10b981',
      '201': '#059669',
      '400': '#f59e0b',
      '401': '#ef4444',
      '403': '#dc2626',
      '404': '#f97316',
      '500': '#7c2d12',
    };
    
    return Object.entries(statusCodes).map(([code, count]) => ({
      name: code,
      value: count,
      fill: colors[code as keyof typeof colors] || '#6b7280'
    }));
  };

  const metrics = getPerformanceMetrics();
  const timeSeriesData = getTimeSeriesData();
  const topEndpoints = getTopEndpoints();
  const statusData = getStatusCodeData();
  const methodData = getMethodDistribution();
  const responseTimeDistribution = getResponseTimeDistribution();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
          API Analytics Overview
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="6h">Last 6 Hours</SelectItem>
                <SelectItem value="12h">Last 12 Hours</SelectItem>
                <SelectItem value="24h" className="font-medium">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="text-xs">
            Live Data
          </Badge>
        </div>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Avg Response</p>
                <p className="text-lg font-bold text-purple-600">
                  {metrics.avgResponseTime.toFixed(1)}ms
                </p>
              </div>
              <Clock className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Requests</p>
                <p className="text-lg font-bold text-blue-600">{metrics.totalRequests}</p>
              </div>
              <Activity className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-lg font-bold text-green-600">{metrics.successRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">P95 Response</p>
                <p className="text-lg font-bold text-orange-600">{metrics.p95ResponseTime.toFixed(1)}ms</p>
              </div>
              <Target className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Throughput</p>
                <p className="text-lg font-bold text-indigo-600">{metrics.throughput.toFixed(1)}/h</p>
              </div>
              <BarChart3 className="h-6 w-6 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Error Rate</p>
                <p className="text-lg font-bold text-red-600">{metrics.errorRate.toFixed(1)}%</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Request Volume & Response Time Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Request Volume & Response Time ({timeRange})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af"
                  tick={{ fontSize: 11 }}
                />
                <YAxis yAxisId="left" stroke="#9ca3af" />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb'
                  }}
                  labelFormatter={(value) => `Time: ${value}`}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="requests"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="Requests"
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="errors"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                  name="Errors"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgResponseTime"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 1, r: 3 }}
                  name="Avg Response Time (ms)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Code & Method Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              Status Codes & HTTP Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Status Codes</h4>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={40}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">HTTP Methods</h4>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={methodData} layout="horizontal">
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="method" type="category" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f9fafb'
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Response Time Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-500" />
            Response Time Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart data={responseTimeDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="endpoint" 
                stroke="#9ca3af"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                dataKey="time"
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
                labelFormatter={(label) => `Endpoint: ${label}`}
              />
              <Scatter dataKey="time" fill="#8b5cf6" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Enhanced Endpoints Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Endpoint Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topEndpoints.map((endpoint, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-blue-600 dark:text-blue-400 font-medium">
                      {endpoint.endpoint}
                    </span>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {endpoint.count} requests
                      </Badge>
                      <Badge 
                        variant={endpoint.errorRate > 5 ? "destructive" : "default"} 
                        className="text-xs"
                      >
                        {endpoint.errorRate}% errors
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>Avg Response: {endpoint.avgResponseTime}ms</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-yellow-500 h-1 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min((endpoint.avgResponseTime / 1000) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {topEndpoints.length === 0 && (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No endpoint data available</p>
                <p className="text-sm text-gray-400">API requests will appear here when available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}