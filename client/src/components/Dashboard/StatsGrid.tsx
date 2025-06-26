import { Box, Cloud, HardDrive, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ApiError } from '@/components/ui/api-error';
import { useModels, useCacheStatus } from '@/hooks/useLocalAPI';

const statsData = [
  {
    name: 'Local Models',
    icon: Box,
    color: 'text-blue-500',
    key: 'localModels',
  },
  {
    name: 'External APIs',
    icon: Cloud,
    color: 'text-purple-500',
    key: 'externalAPIs',
  },
  {
    name: 'Cached Models',
    icon: HardDrive,
    color: 'text-emerald-500',
    key: 'cachedModels',
  },
  {
    name: 'Requests Today',
    icon: TrendingUp,
    color: 'text-amber-500',
    key: 'requestsToday',
  },
];

export function StatsGrid() {
  const { data: modelsData, error: modelsError } = useModels();
  const { data: cacheData, error: cacheError } = useCacheStatus();

  // Show error state if both APIs are failing
  if (modelsError && cacheError) {
    return (
      <ApiError 
        error={modelsError as Error} 
        title="Unable to Load Statistics"
      />
    );
  }

  const stats = {
    localModels: modelsData?.count || 0,
    externalAPIs: 0, // TODO: Get from external APIs
    cachedModels: cacheData?.count || 0,
    requestsToday: 0, // TODO: Get from analytics
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {statsData.map((item, index) => {
        const Icon = item.icon;
        const value = stats[item.key as keyof typeof stats];
        const hasError = (item.key === 'localModels' && modelsError) || 
                        (item.key === 'cachedModels' && cacheError);
        
        return (
          <Card key={item.name} className={`relative overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 group ${
            hasError 
              ? 'border-amber-200/50 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10' 
              : 'hover:shadow-lg'
          }`}>
            <CardContent className="p-3 sm:p-4 relative z-10">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className={`p-2 rounded-lg transition-all duration-300 group-hover:scale-105 ${
                  hasError 
                    ? 'bg-amber-100 dark:bg-amber-900/30' 
                    : 'bg-muted/50 group-hover:bg-primary/10'
                }`}>
                  <Icon className={`h-4 w-4 transition-all duration-300 ${
                    hasError 
                      ? 'text-amber-600 dark:text-amber-400' 
                      : `${item.color} group-hover:scale-110`
                  }`} />
                </div>
                
                <div className="text-right">
                  <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                    hasError 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' 
                      : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
                  }`}>
                    {hasError ? 'Error' : 'Active'}
                  </div>
                </div>
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <p className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${
                  hasError 
                    ? 'text-amber-800 dark:text-amber-200' 
                    : 'text-muted-foreground group-hover:text-foreground'
                }`}>
                  {item.name}
                </p>
                <div className="flex items-baseline space-x-2">
                  <p className={`text-xl sm:text-2xl font-bold transition-all duration-300 ${
                    hasError 
                      ? 'text-amber-900 dark:text-amber-100' 
                      : 'text-foreground group-hover:scale-105'
                  }`}>
                    {hasError ? '—' : value}
                  </p>
                  {!hasError && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                      <span className="text-xs mono text-emerald-400">+12%</span>
                    </div>
                  )}
                </div>
                
                {!hasError && (
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">Last 24h</span>
                    <div className="flex space-x-0.5">
                      {[...Array(6)].map((_, i) => (
                        <div 
                          key={i} 
                          className="w-0.5 bg-primary/30 rounded-full group-hover:bg-primary transition-colors duration-200"
                          style={{ height: `${Math.random() * 12 + 3}px` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            
            {/* Animated background effect */}
            {!hasError && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
                <div className="h-full w-full bg-gradient-to-br from-primary/20 to-purple-500/20" />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
