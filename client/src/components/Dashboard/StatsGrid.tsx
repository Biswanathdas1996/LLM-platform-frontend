import { Box, Cloud, HardDrive, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ApiError } from '@/components/ui/api-error';
import { useModels, useCacheStatus } from '@/hooks/useLocalAPI';

const statsData = [
  {
    name: 'Local Models',
    icon: Box,
    color: 'text-white',
    bgGradient: 'bg-gradient-to-br from-blue-500 to-purple-600',
    key: 'localModels',
  },
  {
    name: 'External APIs',
    icon: Cloud,
    color: 'text-white',
    bgGradient: 'bg-gradient-to-br from-purple-500 to-pink-600',
    key: 'externalAPIs',
  },
  {
    name: 'Cached Models',
    icon: HardDrive,
    color: 'text-white',
    bgGradient: 'bg-gradient-to-br from-emerald-500 to-cyan-600',
    key: 'cachedModels',
  },
  {
    name: 'Requests Today',
    icon: TrendingUp,
    color: 'text-white',
    bgGradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statsData.map((item, index) => {
        const Icon = item.icon;
        const value = stats[item.key as keyof typeof stats];
        const hasError = (item.key === 'localModels' && modelsError) || 
                        (item.key === 'cachedModels' && cacheError);
        
        return (
          <Card key={item.name} className="modern-card overflow-hidden">
            <CardContent className="p-4 relative">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-md ${item.bgGradient} shadow-lg`}>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{item.name}</p>
                  <p className="text-2xl font-semibold text-foreground">
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
