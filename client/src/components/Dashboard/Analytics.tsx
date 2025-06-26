import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Activity, TrendingUp, Clock } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';
  message: string;
  module: string;
  method?: string;
  status_code?: number;
  duration_ms?: number;
}

interface LogsResponse {
  api_logs: LogEntry[];
  error_logs: LogEntry[];
}

export function Analytics() {
  const [logsData, setLogsData] = useState<LogsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

    fetchAnalyticsData();
  }, []);

  // Prepare data for Activity Over Time chart
  const getActivityOverTime = () => {
    if (!logsData) return [];
    
    const allLogs = [...logsData.api_logs, ...logsData.error_logs];
    const hourlyData: Record<string, { hour: string; requests: number; errors: number }> = {};
    
    allLogs.forEach(log => {
      const date = new Date(log.timestamp);
      const hour = `${date.getHours().toString().padStart(2, '0')}:00`;
      
      if (!hourlyData[hour]) {
        hourlyData[hour] = { hour, requests: 0, errors: 0 };
      }
      
      if (log.level === 'ERROR') {
        hourlyData[hour].errors++;
      } else {
        hourlyData[hour].requests++;
      }
    });
    
    return Object.values(hourlyData).sort((a, b) => a.hour.localeCompare(b.hour));
  };

  // Prepare data for Response Time Distribution
  const getResponseTimeData = () => {
    if (!logsData) return [];
    
    const responseTimes = logsData.api_logs
      .filter(log => log.duration_ms && log.duration_ms > 0)
      .map(log => log.duration_ms!);
    
    if (responseTimes.length === 0) return [];
    
    // Group into buckets
    const buckets = [
      { range: '0-50ms', min: 0, max: 50, count: 0 },
      { range: '50-100ms', min: 50, max: 100, count: 0 },
      { range: '100-200ms', min: 100, max: 200, count: 0 },
      { range: '200-500ms', min: 200, max: 500, count: 0 },
      { range: '500ms+', min: 500, max: Infinity, count: 0 }
    ];
    
    responseTimes.forEach(time => {
      const bucket = buckets.find(b => time >= b.min && time < b.max);
      if (bucket) bucket.count++;
    });
    
    return buckets.filter(b => b.count > 0);
  };

  // Prepare data for Status Code Distribution
  const getStatusCodeData = () => {
    if (!logsData) return [];
    
    const statusCounts: Record<string, number> = {};
    
    logsData.api_logs.forEach(log => {
      if (log.status_code) {
        const statusClass = Math.floor(log.status_code / 100) * 100;
        const label = `${statusClass}xx`;
        statusCounts[label] = (statusCounts[label] || 0) + 1;
      }
    });
    
    const colors = {
      '200xx': '#10b981', // green
      '300xx': '#3b82f6', // blue
      '400xx': '#f59e0b', // yellow
      '500xx': '#ef4444'  // red
    };
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      color: colors[status as keyof typeof colors] || '#6b7280'
    }));
  };

  const activityData = getActivityOverTime();
  const responseTimeData = getResponseTimeData();
  const statusCodeData = getStatusCodeData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
                <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-blue-600" />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
          API Analytics
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Activity Over Time */}
        <Card className="lg:col-span-2 xl:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Activity Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fontSize: 12 }}
                    className="text-slate-600 dark:text-slate-400"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-slate-600 dark:text-slate-400"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgb(15 23 42)', 
                      border: '1px solid rgb(30 41 59)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Bar dataKey="requests" fill="#10b981" name="Requests" />
                  <Bar dataKey="errors" fill="#ef4444" name="Errors" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Code Distribution */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-green-600" />
              Status Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusCodeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {statusCodeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgb(15 23 42)', 
                      border: '1px solid rgb(30 41 59)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {statusCodeData.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-slate-600 dark:text-slate-400">
                    {item.status}: {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Response Time Distribution */}
        <Card className="lg:col-span-2 xl:col-span-3">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-purple-600" />
              Response Time Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={responseTimeData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 12 }}
                    className="text-slate-600 dark:text-slate-400"
                  />
                  <YAxis 
                    type="category"
                    dataKey="range"
                    tick={{ fontSize: 12 }}
                    className="text-slate-600 dark:text-slate-400"
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgb(15 23 42)', 
                      border: '1px solid rgb(30 41 59)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}