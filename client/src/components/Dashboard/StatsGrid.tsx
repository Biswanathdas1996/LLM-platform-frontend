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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((item) => {
        const Icon = item.icon;
        const value = stats[item.key as keyof typeof stats];
        const hasError = (item.key === 'localModels' && modelsError) || 
                        (item.key === 'cachedModels' && cacheError);
        
        return (
          <Card key={item.name} className={`bg-white dark:bg-slate-800 border ${
            hasError 
              ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20' 
              : 'border-slate-200 dark:border-slate-700'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className={`h-6 w-6 ${hasError ? 'text-amber-600 dark:text-amber-400' : item.color}`} />
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${
                    hasError 
                      ? 'text-amber-800 dark:text-amber-200' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {item.name}
                  </p>
                  <p className={`text-2xl font-bold ${
                    hasError 
                      ? 'text-amber-900 dark:text-amber-100' 
                      : 'text-slate-900 dark:text-white'
                  }`}>
                    {hasError ? '—' : value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
