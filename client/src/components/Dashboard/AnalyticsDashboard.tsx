import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBump } from '@nivo/bump';
import { ResponsiveSunburst } from '@nivo/sunburst';
import { ResponsiveBar } from '@nivo/bar';

import { useExternalLogs } from '@/hooks/useLocalAPI';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, Activity, Clock, FileText, BarChart3 } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';
  message: string;
  module: string;
  endpoint?: string;
  method?: string;
  status_code?: number;
  duration_ms?: number;
  type: 'request' | 'response' | 'endpoint_execution';
}

interface LogsData {
  api_logs: LogEntry[];
  error_logs: LogEntry[];
}

export function AnalyticsDashboard() {
  const { data: logsData, isLoading, error } = useExternalLogs();

  // Process logs data for analytics
  const analytics = useMemo(() => {
    if (!logsData) return null;

    const allLogs = [...logsData.api_logs, ...logsData.error_logs];
    
    // Log level distribution for pie chart
    const logLevelCounts = allLogs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(logLevelCounts).map(([level, count]) => ({
      id: level,
      label: level,
      value: count,
      color: level === 'ERROR' ? '#ef4444' : level === 'WARN' ? '#f59e0b' : level === 'INFO' ? '#3b82f6' : '#6b7280'
    }));

    // API endpoint usage for bar chart
    const endpointCounts = allLogs
      .filter(log => log.endpoint)
      .reduce((acc, log) => {
        acc[log.endpoint!] = (acc[log.endpoint!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const barData = Object.entries(endpointCounts).map(([endpoint, count]) => ({
      endpoint: endpoint.split('/').pop() || endpoint,
      requests: count,
      color: '#8b5cf6'
    }));

    // Response time trends for line chart
    const responseTimeTrends = allLogs
      .filter(log => log.duration_ms && log.timestamp)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((log, index) => ({
        x: new Date(log.timestamp).toLocaleTimeString(),
        y: log.duration_ms!
      }));

    const lineData = [{
      id: 'response_time',
      data: responseTimeTrends.slice(-20) // Last 20 entries
    }];

    // HTTP method distribution for sunburst
    const methodCounts = allLogs
      .filter(log => log.method)
      .reduce((acc, log) => {
        acc[log.method!] = (acc[log.method!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const sunburstData = {
      name: 'HTTP Methods',
      children: Object.entries(methodCounts).map(([method, count]) => ({
        name: method,
        value: count
      }))
    };

    // Status code analysis for bump chart
    const statusCodes = allLogs
      .filter(log => log.status_code)
      .reduce((acc, log) => {
        const code = Math.floor(log.status_code! / 100) * 100;
        const codeRange = `${code}xx`;
        acc[codeRange] = (acc[codeRange] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const bumpData = Object.entries(statusCodes).map(([range, count]) => ({
      id: range,
      data: [{ x: 'current', y: count }]
    }));

    // Request timing distribution by endpoint
    const endpointTiming = allLogs
      .filter(log => log.duration_ms && log.endpoint)
      .reduce((acc, log) => {
        const endpoint = log.endpoint!.split('/').pop() || 'unknown';
        if (!acc[endpoint]) {
          acc[endpoint] = { total: 0, count: 0 };
        }
        acc[endpoint].total += log.duration_ms!;
        acc[endpoint].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

    const timingData = Object.entries(endpointTiming).map(([endpoint, data]) => ({
      endpoint,
      avgTime: Math.round(data.total / data.count),
      requests: data.count
    }));

    return {
      pieData,
      barData,
      lineData,
      sunburstData,
      bumpData,
      timingData,
      totalLogs: allLogs.length,
      errorRate: ((logsData.error_logs.length / allLogs.length) * 100).toFixed(1),
      avgResponseTime: responseTimeTrends.length > 0 
        ? (responseTimeTrends.reduce((sum, item) => sum + item.y, 0) / responseTimeTrends.length).toFixed(1)
        : '0'
    };
  }, [logsData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="modern-card-violet">
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="modern-card-emerald">
              <CardContent className="p-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="modern-card-rose">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Unable to Load Analytics</h3>
            <p className="text-muted-foreground">Failed to fetch logs data for analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="modern-card-violet">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Logs</p>
                <p className="text-2xl font-bold text-foreground">{analytics.totalLogs}</p>
              </div>
              <FileText className="h-8 w-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card-emerald">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold text-foreground">{analytics.errorRate}%</p>
              </div>
              <AlertCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card-rose">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold text-foreground">{analytics.avgResponseTime}ms</p>
              </div>
              <Clock className="h-8 w-8 text-rose-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card-amber">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Calls</p>
                <p className="text-2xl font-bold text-foreground">{analytics.barData.reduce((sum, item) => sum + item.requests, 0)}</p>
              </div>
              <Activity className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Log Level Distribution - Modern Pie Chart */}
        <Card className="modern-card-violet group hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-500">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30">
                <BarChart3 className="h-5 w-5 text-violet-400" />
              </div>
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Log Level Distribution
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-80 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-600/5 rounded-lg" />
              <ResponsivePie
                data={analytics.pieData}
                margin={{ top: 30, right: 90, bottom: 30, left: 90 }}
                innerRadius={0.4}
                padAngle={1.2}
                cornerRadius={6}
                activeOuterRadiusOffset={12}
                colors={{ datum: 'data.color' }}
                borderWidth={2}
                borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
                arcLinkLabelsSkipAngle={8}
                arcLinkLabelsTextColor="#e2e8f0"
                arcLinkLabelsThickness={3}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={15}
                arcLabelsTextColor="#1e293b"
                enableArcLabels={true}
                enableArcLinkLabels={true}
                animate={true}
                motionConfig="gentle"
                theme={{
                  background: 'transparent',
                  text: { fill: '#e2e8f0', fontSize: 12, fontWeight: 500 },
                  tooltip: { 
                    container: { 
                      background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
                      color: '#f1f5f9',
                      borderRadius: '12px',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* API Endpoint Usage - Bar Chart */}
        <Card className="modern-card-emerald">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              API Endpoint Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveBar
                data={analytics.barData}
                keys={['requests']}
                indexBy="endpoint"
                margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                colors="#10b981"
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor="#1e293b"
                theme={{
                  background: 'transparent',
                  text: { fill: '#e2e8f0' },
                  axis: { ticks: { text: { fill: '#e2e8f0' } } },
                  tooltip: { container: { background: '#1e293b', color: '#e2e8f0' } }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Response Time Trends - Line Chart */}
        <Card className="modern-card-rose">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-rose-500" />
              Response Time Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveLine
                data={analytics.lineData}
                margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                curve="cardinal"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                }}
                colors="#f43f5e"
                pointSize={6}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                enableArea={true}
                areaOpacity={0.1}
                useMesh={true}
                theme={{
                  background: 'transparent',
                  text: { fill: '#e2e8f0' },
                  axis: { ticks: { text: { fill: '#e2e8f0' } } },
                  tooltip: { container: { background: '#1e293b', color: '#e2e8f0' } }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* HTTP Methods - Sunburst Chart */}
        <Card className="modern-card-amber">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-500" />
              HTTP Methods Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveSunburst
                data={analytics.sunburstData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                id="name"
                value="value"
                cornerRadius={2}
                borderWidth={1}
                borderColor={{ theme: 'background' }}
                colors={['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a']}
                childColor={{ from: 'color', modifiers: [['brighter', 0.1]] }}
                theme={{
                  background: 'transparent',
                  text: { fill: '#1e293b' },
                  tooltip: { container: { background: '#1e293b', color: '#e2e8f0' } }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Codes - Bump Chart */}
        <Card className="modern-card-blue-indigo">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Status Code Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveBump
                data={analytics.bumpData}
                colors={['#3b82f6', '#6366f1', '#8b5cf6', '#d946ef']}
                lineWidth={3}
                activeLineWidth={6}
                inactiveLineWidth={3}
                inactiveOpacity={0.15}
                pointSize={10}
                activePointSize={16}
                inactivePointSize={0}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={3}
                activePointBorderWidth={3}
                pointBorderColor={{ from: 'serie.color' }}
                axisTop={null}
                axisBottom={null}
                axisLeft={null}
                axisRight={null}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                theme={{
                  background: 'transparent',
                  text: { fill: '#e2e8f0' },
                  tooltip: { container: { background: '#1e293b', color: '#e2e8f0' } }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Average Response Time by Endpoint */}
        <Card className="modern-card-cyan-teal">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-500" />
              Average Response Time by Endpoint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveBar
                data={analytics.timingData}
                keys={['avgTime']}
                indexBy="endpoint"
                margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                colors="#06b6d4"
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor="#1e293b"
                theme={{
                  background: 'transparent',
                  text: { fill: '#e2e8f0' },
                  axis: { ticks: { text: { fill: '#e2e8f0' } } },
                  tooltip: { container: { background: '#1e293b', color: '#e2e8f0' } }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}