import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Activity, Clock, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

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

  const getPerformanceMetrics = () => {
    if (!logsData) return { avgResponseTime: 0, totalRequests: 0, errorRate: 0, successRate: 0 };
    
    const apiLogs = logsData.api_logs;
    const errorLogs = logsData.error_logs;
    
    const responseTimes = apiLogs
      .filter(log => log.duration_ms && log.duration_ms > 0)
      .map(log => log.duration_ms!);
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    const totalRequests = apiLogs.length;
    const errors = errorLogs.length;
    const errorRate = totalRequests > 0 ? (errors / (totalRequests + errors)) * 100 : 0;
    const successRate = 100 - errorRate;
    
    return { avgResponseTime, totalRequests, errorRate, successRate };
  };

  const getHourlyActivity = () => {
    if (!logsData) return [];
    
    const allLogs = [...logsData.api_logs, ...logsData.error_logs];
    const now = new Date();
    const last12Hours = [];
    
    for (let i = 11; i >= 0; i--) {
      const hour = new Date(now.getTime() - (i * 60 * 60 * 1000));
      hour.setMinutes(0, 0, 0);
      last12Hours.push(hour);
    }
    
    return last12Hours.map(hour => {
      const nextHour = new Date(hour.getTime() + 60 * 60 * 1000);
      const hourLogs = allLogs.filter(log => {
        const logTime = new Date(log.timestamp);
        return logTime >= hour && logTime < nextHour;
      });
      
      return {
        time: hour.toLocaleTimeString('en-IN', { 
          timeZone: 'Asia/Kolkata', 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        requests: hourLogs.filter(log => log.level !== 'ERROR').length,
        errors: hourLogs.filter(log => log.level === 'ERROR').length
      };
    });
  };

  const getTopEndpoints = () => {
    if (!logsData) return [];
    
    const endpointCounts = logsData.api_logs.reduce((acc, log) => {
      if (log.endpoint) {
        acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getStatusCodeData = () => {
    if (!logsData) return [];
    
    const statusCodes = logsData.api_logs.reduce((acc, log) => {
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
  const hourlyData = getHourlyActivity();
  const topEndpoints = getTopEndpoints();
  const statusData = getStatusCodeData();

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
        <Badge variant="outline" className="text-xs">
          Live Data
        </Badge>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response Time</p>
                <p className="text-2xl font-bold text-purple-600">
                  {metrics.avgResponseTime.toFixed(1)}ms
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.totalRequests}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{metrics.successRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Error Rate</p>
                <p className="text-2xl font-bold text-red-600">{metrics.errorRate.toFixed(1)}%</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Activity Timeline (Last 12 Hours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="Requests"
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

        {/* Status Code Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              Status Code Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
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
      </div>

      {/* Top Endpoints Table */}
      <Card>
        <CardHeader>
          <CardTitle>Most Active Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topEndpoints.map((endpoint, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                  {endpoint.endpoint}
                </span>
                <Badge variant="secondary">
                  {endpoint.count} requests
                </Badge>
              </div>
            ))}
            {topEndpoints.length === 0 && (
              <p className="text-gray-500 text-center py-4">No endpoint data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}