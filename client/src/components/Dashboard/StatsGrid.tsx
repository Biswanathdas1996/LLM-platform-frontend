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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {statsData.map((item) => {
        const Icon = item.icon;
        const value = stats[item.key as keyof typeof stats];
        const hasError = (item.key === 'localModels' && modelsError) || 
                        (item.key === 'cachedModels' && cacheError);
        
        return (
          <Card key={item.name} className={`modern-card group ${
            hasError 
              ? 'border-amber-200/50 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10' 
              : ''
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                    hasError 
                      ? 'bg-amber-100 dark:bg-amber-900/30' 
                      : 'bg-muted/50 group-hover:bg-primary/10'
                  }`}>
                    <Icon className={`h-6 w-6 transition-colors duration-300 ${
                      hasError 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : `${item.color} group-hover:text-primary`
                    }`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      hasError 
                        ? 'text-amber-800 dark:text-amber-200' 
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`}>
                      {item.name}
                    </p>
                    <p className={`text-3xl font-bold transition-all duration-300 ${
                      hasError 
                        ? 'text-amber-900 dark:text-amber-100' 
                        : 'text-foreground group-hover:scale-105'
                    }`}>
                      {hasError ? '—' : value.toLocaleString()}
                    </p>
                  </div>
                </div>
                {!hasError && (
                  <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
