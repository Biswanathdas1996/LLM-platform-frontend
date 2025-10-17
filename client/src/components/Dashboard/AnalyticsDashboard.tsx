import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { useExternalLogs } from "@/hooks/useLocalAPI";
import { format, subHours, parseISO } from "date-fns";

interface LogAnalytics {
  totalRequests: number;
  errorRate: number;
  avgResponseTime: number;
  peakHour: string;
}

export function AnalyticsDashboard() {
  const { data: logsData, error: logsError, isLoading: logsLoading } = useExternalLogs();
  const [analytics, setAnalytics] = useState<LogAnalytics | null>(null);

  useEffect(() => {
    if (logsData) {
      // Filter logs from last 24 hours
      const cutoffTime = subHours(new Date(), 24);
      const filteredApiLogs = logsData.api_logs.filter(log => 
        parseISO(log.timestamp) >= cutoffTime
      );
      
      // Calculate analytics from response logs
      const responseLogs = filteredApiLogs.filter(log => log.type === "response");
      const totalRequests = responseLogs.length;
      const errorCount = responseLogs.filter(log => 
        log.status_code && log.status_code >= 400
      ).length;
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
      
      const responseTimes = responseLogs
        .map(log => log.duration_ms || 0)
        .filter(time => time > 0);
      
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;
      
      // Find peak hour
      const hourlyActivity = new Map<number, number>();
      filteredApiLogs.forEach(log => {
        const hour = parseISO(log.timestamp).getHours();
        hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
      });
      
      let peakHour = "00:00";
      let maxActivity = 0;
      hourlyActivity.forEach((count, hour) => {
        if (count > maxActivity) {
          maxActivity = count;
          peakHour = `${hour.toString().padStart(2, '0')}:00`;
        }
      });
      
      setAnalytics({
        totalRequests,
        errorRate,
        avgResponseTime,
        peakHour,
      });
    }
  }, [logsData]);

  if (logsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (logsError) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-muted-foreground">Failed to load analytics data</p>
              <p className="text-sm text-muted-foreground">{logsError.message}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No analytics data available</p>
              <p className="text-sm text-muted-foreground">Waiting for API activity to generate insights</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{analytics.totalRequests.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">{analytics.errorRate.toFixed(1)}%</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{Math.round(analytics.avgResponseTime)}ms</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Peak Hour</p>
                <p className="text-2xl font-bold">{analytics.peakHour}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent API Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logsData && logsData.api_logs.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logsData.api_logs.slice(0, 10).map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      log.status_code && log.status_code >= 400 ? 'bg-red-500' : 'bg-green-500'
                    }`} />
                    <span className="font-mono text-sm">{log.method}</span>
                    <span className="text-sm">{log.endpoint}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(parseISO(log.timestamp), 'HH:mm:ss')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}