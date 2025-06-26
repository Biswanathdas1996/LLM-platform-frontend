import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  Activity, TrendingUp, Clock, AlertTriangle, Server, Zap,
  RefreshCw, Calendar, Filter, Download, BarChart3, PieChart as PieChartIcon,
  LineChart as LineChartIcon, Gauge, Users, Database, Globe
} from 'lucide-react';
import { api, ExternalLogEntry } from '@/lib/api';
import { format, subHours, subDays, parseISO, isWithinInterval } from 'date-fns';

interface LogAnalytics {
  totalRequests: number;
  errorRate: number;
  avgResponseTime: number;
  peakHour: string;
  topEndpoints: Array<{ endpoint: string; count: number; avgTime: number }>;
  statusCodes: Array<{ code: number; count: number; percentage: number }>;
  timeSeriesData: Array<{ timestamp: string; requests: number; errors: number; avgTime: number }>;
  methodDistribution: Array<{ method: string; count: number; percentage: number }>;
  moduleActivity: Array<{ module: string; requests: number; errors: number; avgTime: number }>;
  performanceMetrics: Array<{ endpoint: string; p50: number; p95: number; p99: number }>;
  geographicData: Array<{ region: string; requests: number; latency: number }>;
  hourlyPattern: Array<{ hour: number; requests: number; errors: number }>;
}

interface TimeFilter {
  label: string;
  value: string;
  hours: number;
}

const timeFilters: TimeFilter[] = [
  { label: 'Last Hour', value: '1h', hours: 1 },
  { label: 'Last 6 Hours', value: '6h', hours: 6 },
  { label: 'Last 24 Hours', value: '24h', hours: 24 },
  { label: 'Last 7 Days', value: '7d', hours: 168 },
  { label: 'Last 30 Days', value: '30d', hours: 720 }
];

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

export function AnalyticsDashboard() {
  const [logs, setLogs] = useState<{ api_logs: ExternalLogEntry[]; error_logs: ExternalLogEntry[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState<string>('24h');
  const [analytics, setAnalytics] = useState<LogAnalytics | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30 seconds
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Fetch real log data from the API endpoint
      const response = await fetch('http://127.0.0.1:5000/api/v1/logs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status} ${response.statusText}`);
      }

      const logData = await response.json();
      setLogs(logData);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setLogs({ api_logs: [], error_logs: [] });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const filteredLogs = useMemo(() => {
    if (!logs) return { api_logs: [], error_logs: [] };
    
    const selectedFilter = timeFilters.find(f => f.value === timeFilter);
    if (!selectedFilter) return logs;

    const cutoffTime = subHours(new Date(), selectedFilter.hours);
    
    return {
      api_logs: logs.api_logs.filter(log => 
        parseISO(log.timestamp) >= cutoffTime
      ),
      error_logs: logs.error_logs.filter(log => 
        parseISO(log.timestamp) >= cutoffTime
      )
    };
  }, [logs, timeFilter]);

  useEffect(() => {
    if (!filteredLogs.api_logs.length && !filteredLogs.error_logs.length) return;

    const allLogs = [...filteredLogs.api_logs, ...filteredLogs.error_logs];
    
    // Filter logs by type to avoid double counting
    const responseLogs = filteredLogs.api_logs.filter(log => log.type === 'response' || log.type === 'endpoint_execution');
    const requestLogs = filteredLogs.api_logs.filter(log => log.type === 'request');
    
    const totalRequests = responseLogs.length;
    const errorCount = filteredLogs.error_logs.length + filteredLogs.api_logs.filter(log => log.level === 'ERROR').length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    // Calculate average response time from duration_ms or duration_s
    const responseTimes = responseLogs
      .map(log => {
        if (log.duration_ms) return log.duration_ms;
        if (log.duration_s) return log.duration_s * 1000;
        return null;
      })
      .filter(time => time !== null) as number[];
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    // Peak hour analysis
    const hourCounts = responseLogs.reduce((acc, log) => {
      const hour = format(parseISO(log.timestamp), 'HH:00');
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const peakHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    // Top endpoints - extract from URL or use endpoint field
    const endpointStats = responseLogs.reduce((acc, log) => {
      let endpoint = log.endpoint;
      if (!endpoint && log.url) {
        // Extract endpoint from URL path
        const urlPath = log.url.split('/').pop() || 'unknown';
        endpoint = urlPath.split('?')[0]; // Remove query params
      }
      endpoint = endpoint || 'unknown';
      
      if (!acc[endpoint]) {
        acc[endpoint] = { count: 0, totalTime: 0, times: [] };
      }
      acc[endpoint].count++;
      
      const duration = log.duration_ms || (log.duration_s ? log.duration_s * 1000 : null);
      if (duration) {
        acc[endpoint].totalTime += duration;
        acc[endpoint].times.push(duration);
      }
      return acc;
    }, {} as Record<string, { count: number; totalTime: number; times: number[] }>);

    const topEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgTime: stats.times.length > 0 ? stats.totalTime / stats.times.length : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Status codes distribution
    const statusCodeCounts = responseLogs.reduce((acc, log) => {
      const code = log.status_code || (log.level === 'ERROR' ? 500 : 200);
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const statusCodes = Object.entries(statusCodeCounts)
      .map(([code, count]) => ({
        code: parseInt(code),
        count,
        percentage: totalRequests > 0 ? (count / totalRequests) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Time series data (hourly buckets)
    const timeSeriesMap = new Map<string, { requests: number; errors: number; times: number[] }>();
    responseLogs.forEach(log => {
      const hourKey = format(parseISO(log.timestamp), 'yyyy-MM-dd HH:00');
      if (!timeSeriesMap.has(hourKey)) {
        timeSeriesMap.set(hourKey, { requests: 0, errors: 0, times: [] });
      }
      const bucket = timeSeriesMap.get(hourKey)!;
      bucket.requests++;
      
      const duration = log.duration_ms || (log.duration_s ? log.duration_s * 1000 : null);
      if (duration) {
        bucket.times.push(duration);
      }
      
      if (log.level === 'ERROR' || (log.status_code && log.status_code >= 400)) {
        bucket.errors++;
      }
    });

    const timeSeriesData = Array.from(timeSeriesMap.entries())
      .map(([timestamp, data]) => ({
        timestamp,
        requests: data.requests,
        errors: data.errors,
        avgTime: data.times.length > 0 ? data.times.reduce((a, b) => a + b, 0) / data.times.length : 0
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    // Method distribution from request logs
    const methodCounts = requestLogs.reduce((acc, log) => {
      const method = log.method || 'GET';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const methodDistribution = Object.entries(methodCounts)
      .map(([method, count]) => ({
        method,
        count,
        percentage: requestLogs.length > 0 ? (count / requestLogs.length) * 100 : 0
      }));

    // Module activity
    const moduleStats = allLogs.reduce((acc, log) => {
      const module = log.module || 'unknown';
      if (!acc[module]) {
        acc[module] = { requests: 0, errors: 0, times: [] };
      }
      
      if (log.type === 'response' || log.type === 'endpoint_execution') {
        acc[module].requests++;
        const duration = log.duration_ms || (log.duration_s ? log.duration_s * 1000 : null);
        if (duration) {
          acc[module].times.push(duration);
        }
      }
      
      if (log.level === 'ERROR' || (log.status_code && log.status_code >= 400)) {
        acc[module].errors++;
      }
      return acc;
    }, {} as Record<string, { requests: number; errors: number; times: number[] }>);

    const moduleActivity = Object.entries(moduleStats)
      .map(([module, stats]) => ({
        module,
        requests: stats.requests,
        errors: stats.errors,
        avgTime: stats.times.length > 0 ? stats.times.reduce((a, b) => a + b, 0) / stats.times.length : 0
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5);

    // Performance metrics (percentiles)
    const performanceMetrics = topEndpoints.map(endpoint => {
      const times = endpointStats[endpoint.endpoint].times.sort((a, b) => a - b);
      return {
        endpoint: endpoint.endpoint,
        p50: times[Math.floor(times.length * 0.5)] || 0,
        p95: times[Math.floor(times.length * 0.95)] || 0,
        p99: times[Math.floor(times.length * 0.99)] || 0
      };
    });

    // Geographic data based on remote_addr patterns
    const ipCounts = requestLogs.reduce((acc, log) => {
      if (log.remote_addr) {
        const region = log.remote_addr.startsWith('127.0.0.1') ? 'Local' : 
                      log.remote_addr.startsWith('192.168') ? 'LAN' :
                      log.remote_addr.startsWith('10.') ? 'Private' : 'External';
        acc[region] = (acc[region] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const geographicData = Object.entries(ipCounts)
      .map(([region, requests]) => ({
        region,
        requests,
        latency: avgResponseTime * (region === 'Local' ? 0.5 : region === 'LAN' ? 1.0 : 1.5)
      }))
      .sort((a, b) => b.requests - a.requests);

    // Hourly pattern
    const hourlyPattern = Array.from({ length: 24 }, (_, hour) => {
      const hourRequests = responseLogs.filter(log => 
        parseInt(format(parseISO(log.timestamp), 'H')) === hour
      );
      const hourErrors = allLogs.filter(log => 
        parseInt(format(parseISO(log.timestamp), 'H')) === hour &&
        (log.level === 'ERROR' || (log.status_code && log.status_code >= 400))
      );
      return {
        hour,
        requests: hourRequests.length,
        errors: hourErrors.length
      };
    });

    setAnalytics({
      totalRequests,
      errorRate,
      avgResponseTime,
      peakHour,
      topEndpoints,
      statusCodes,
      timeSeriesData,
      methodDistribution,
      moduleActivity,
      performanceMetrics,
      geographicData,
      hourlyPattern
    });
  }, [filteredLogs]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
            <p className="text-gray-600 dark:text-gray-400">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics && (!logs || (logs.api_logs.length === 0 && logs.error_logs.length === 0))) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Analytics Data Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The Local LLM API at 127.0.0.1:5000 is not responding or has no log data.
            </p>
            <Button onClick={fetchLogs} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
            <p className="text-gray-600 dark:text-gray-400">Processing analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive log analysis and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeFilters.map(filter => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchLogs}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Requests</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {analytics.totalRequests.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-purple-500 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Error Rate</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {analytics.errorRate.toFixed(2)}%
                </p>
              </div>
              <div className="p-2 bg-red-500 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Avg Response Time</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {analytics.avgResponseTime.toFixed(0)}ms
                </p>
              </div>
              <div className="p-2 bg-green-500 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Peak Hour</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {analytics.peakHour}
                </p>
              </div>
              <div className="p-2 bg-blue-500 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Distribution
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4" />
            Patterns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Request Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Request Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => format(parseISO(value), 'HH:mm')}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="requests" 
                      stackId="1"
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.6}
                      name="Requests"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="errors" 
                      stackId="1"
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.8}
                      name="Errors"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Top Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topEndpoints}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="endpoint" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="count" fill="#06b6d4" name="Request Count" />
                    <Bar dataKey="avgTime" fill="#10b981" name="Avg Response Time (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Response Time Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Response Time Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => format(parseISO(value), 'HH:mm')}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="avgTime" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                      name="Avg Response Time (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Performance Percentiles */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Percentiles by Endpoint</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.performanceMetrics}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="endpoint" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="p50" fill="#10b981" name="P50 (ms)" />
                    <Bar dataKey="p95" fill="#f59e0b" name="P95 (ms)" />
                    <Bar dataKey="p99" fill="#ef4444" name="P99 (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Code Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Status Code Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.statusCodes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ code, percentage }) => `${code} (${percentage.toFixed(1)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics.statusCodes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* HTTP Method Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>HTTP Method Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.methodDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {analytics.methodDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Geographic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Geographic Request Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.geographicData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="region" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="requests" fill="#8b5cf6" name="Requests" />
                    <Bar yAxisId="right" dataKey="latency" fill="#06b6d4" name="Avg Latency (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          {/* Hourly Activity Pattern */}
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Activity Pattern</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.hourlyPattern}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(value) => `${value}:00`}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="requests" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.6}
                      name="Requests"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="errors" 
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.8}
                      name="Errors"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Module Activity Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Module Activity Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={analytics.moduleActivity}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="module" />
                    <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} />
                    <Radar
                      name="Requests"
                      dataKey="requests"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Errors"
                      dataKey="errors"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.3}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Real-time Status */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Analytics</span>
              </div>
              {lastRefresh && (
                <span className="text-xs text-gray-500">
                  Last updated: {format(lastRefresh, 'HH:mm:ss')}
                </span>
              )}
            </div>
            <Badge variant="outline" className="text-xs">
              Auto-refresh: {refreshInterval / 1000}s
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}