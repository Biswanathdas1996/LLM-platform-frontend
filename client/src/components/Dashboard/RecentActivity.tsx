import { PlayCircle, Upload, RotateCcw, Plug, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExternalLogs } from '@/hooks/useLocalAPI';
import { ApiError } from '@/components/ui/api-error';

interface ActivityItem {
  id: string;
  type: 'generation' | 'upload' | 'sync' | 'api' | 'error';
  icon: any;
  iconColor: string;
  description: string;
  model: string;
  timestamp: string;
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

function parseLogActivity(apiLogs: any[], errorLogs: any[]): ActivityItem[] {
  const activities: ActivityItem[] = [];
  
  // Process API logs for successful activities
  const recentApiLogs = apiLogs.slice(0, 20).filter(log => 
    log.type === 'endpoint_execution' && log.status === 'success'
  );
  
  recentApiLogs.forEach((log, index) => {
    let type: ActivityItem['type'] = 'api';
    let description = 'Unknown activity';
    let model = log.endpoint || 'System';
    let icon = PlayCircle;
    let iconColor = 'text-blue-500';
    
    switch (log.endpoint) {
      case 'generate_response':
        type = 'generation';
        description = 'Text generation completed';
        icon = PlayCircle;
        iconColor = 'text-blue-500';
        model = 'Local Model';
        break;
      case 'upload_model':
        type = 'upload';
        description = 'Model uploaded successfully';
        icon = Upload;
        iconColor = 'text-emerald-500';
        model = 'GGUF Model';
        break;
      case 'sync_models':
        type = 'sync';
        description = 'Models synchronized';
        icon = RotateCcw;
        iconColor = 'text-blue-500';
        model = 'Repository';
        break;
      case 'list_models':
        type = 'api';
        description = 'Models list accessed';
        icon = Plug;
        iconColor = 'text-purple-500';
        model = 'API';
        break;
      case 'clear_cache':
        type = 'api';
        description = 'Cache cleared';
        icon = RotateCcw;
        iconColor = 'text-orange-500';
        model = 'System';
        break;
    }
    
    activities.push({
      id: log.request_id || `api-${index}`,
      type,
      icon,
      iconColor,
      description,
      model,
      timestamp: formatTimeAgo(log.timestamp)
    });
  });
  
  // Process error logs
  const recentErrorLogs = errorLogs.slice(0, 5);
  recentErrorLogs.forEach((log, index) => {
    activities.push({
      id: log.request_id || `error-${index}`,
      type: 'error',
      icon: AlertCircle,
      iconColor: 'text-red-500',
      description: 'Error occurred',
      model: log.endpoint || 'System',
      timestamp: formatTimeAgo(log.timestamp)
    });
  });
  
  // Sort by timestamp (most recent first) and limit to 6 items
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);
}

export function RecentActivity() {
  const { data: logsData, error, isLoading } = useExternalLogs();

  if (error) {
    return (
      <Card className="modern-card overflow-hidden border-2 border-red-200/60 dark:border-red-800/30 bg-gradient-to-br from-red-50/50 to-pink-50/30 dark:from-red-950/20 dark:to-pink-950/10">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ApiError error={error as Error} />
        </CardContent>
      </Card>
    );
  }

  const activities = logsData ? parseLogActivity(logsData.api_logs || [], logsData.error_logs || []) : [];

  // Show loading state or fallback message
  if (isLoading || activities.length === 0) {
    const fallbackActivities = [
      {
        id: 'loading-1',
        type: 'api' as const,
        icon: Plug,
        iconColor: 'text-muted-foreground',
        description: isLoading ? 'Loading activities...' : 'No recent activity',
        model: 'System',
        timestamp: 'Just now'
      }
    ];
    
    return (
      <Card className="modern-card overflow-hidden border-2 border-indigo-200/60 dark:border-indigo-800/30 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 backdrop-blur-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group">
        <CardHeader className="pb-3 relative">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-600 shadow-lg">
              <PlayCircle className="h-5 w-5 text-white drop-shadow-sm" />
            </div>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground py-4">
            {isLoading ? 'Loading recent activity...' : 'No recent activity to display'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="modern-card overflow-hidden border-2 border-indigo-200/60 dark:border-indigo-800/30 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 backdrop-blur-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group">
      <CardHeader className="pb-3 relative">
        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
            <PlayCircle className="h-5 w-5 text-white drop-shadow-sm" />
          </div>
          Recent Activity
        </CardTitle>
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-5 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-600 rounded-bl-full"></div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 relative z-10">
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            
            return (
              <div 
                key={activity.id} 
                className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-muted/20 to-muted/10 border border-border/30 hover:border-primary/20 transition-all duration-300 hover:shadow-md p-3"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-purple-500/3 to-teal-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`p-1.5 rounded-lg ${
                      activity.type === 'error' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                      'bg-gradient-to-br from-blue-500 to-purple-600'
                    } group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300`}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-300">
                        {activity.description}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {activity.timestamp}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {activity.model}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                      <div className="flex items-center space-x-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          activity.type === 'generation' ? 'bg-blue-400' :
                          activity.type === 'upload' ? 'bg-emerald-400' :
                          activity.type === 'sync' ? 'bg-blue-400' :
                          activity.type === 'error' ? 'bg-red-400' :
                          'bg-purple-400'
                        } animate-pulse`} />
                        <span className="text-xs text-muted-foreground capitalize">
                          {activity.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Progress indicator */}
                <div className="mt-2 w-full bg-muted/30 rounded-full h-0.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      activity.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      'bg-gradient-to-r from-blue-500 to-purple-600'
                    }`}
                    style={{ width: `${100 - (index * 15)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
