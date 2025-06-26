import { Box, Cloud, HardDrive, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ApiError } from '@/components/ui/api-error';
import { useModels, useCacheStatus } from '@/hooks/useLocalAPI';

const statsData = [
  {
    name: 'Local Models',
    icon: Box,
    color: 'text-white',
    bgGradient: 'bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600',
    cardBg: 'bg-gradient-to-br from-violet-50/50 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/10',
    borderColor: 'border-violet-200/60 dark:border-violet-800/30',
    key: 'localModels',
  },
  {
    name: 'External APIs',
    icon: Cloud,
    color: 'text-white',
    bgGradient: 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600',
    cardBg: 'bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10',
    borderColor: 'border-emerald-200/60 dark:border-emerald-800/30',
    key: 'externalAPIs',
  },
  {
    name: 'Cached Models',
    icon: HardDrive,
    color: 'text-white',
    bgGradient: 'bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600',
    cardBg: 'bg-gradient-to-br from-rose-50/50 to-pink-50/30 dark:from-rose-950/20 dark:to-pink-950/10',
    borderColor: 'border-rose-200/60 dark:border-rose-800/30',
    key: 'cachedModels',
  },
  {
    name: 'Requests Today',
    icon: TrendingUp,
    color: 'text-white',
    bgGradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-600',
    cardBg: 'bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10',
    borderColor: 'border-amber-200/60 dark:border-amber-800/30',
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
          <Card key={item.name} className={`modern-card overflow-hidden border-2 ${item.borderColor} ${item.cardBg} backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group`}>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${item.bgGradient} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                    <Icon className={`h-5 w-5 ${item.color} drop-shadow-sm`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground/80 mb-1">{item.name}</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      {hasError ? '—' : value}
                    </p>
                  </div>
                </div>
              </div>
              {/* Decorative gradient overlay */}
              <div className="absolute top-0 right-0 w-20 h-20 opacity-5 overflow-hidden">
                <div className={`w-full h-full ${item.bgGradient} rounded-bl-full`}></div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
