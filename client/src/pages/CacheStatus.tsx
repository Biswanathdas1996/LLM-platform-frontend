import { HardDrive, RotateCcw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCacheStatus, useClearCache } from '@/hooks/useLocalAPI';
import { useNotifications } from '@/hooks/useNotifications';

export default function CacheStatus() {
  const { data: cacheData, isLoading, refetch } = useCacheStatus();
  const clearCacheMutation = useClearCache();
  const { addNotification } = useNotifications();

  const handleClearCache = async () => {
    try {
      await clearCacheMutation.mutateAsync();
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Cache cleared successfully',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to clear cache',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Technical Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 p-8 border border-orange-500/20">
        <div className="absolute inset-0 tech-grid opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shadow-glow" />
              <span className="text-sm mono text-orange-400 font-medium">CACHE_SYSTEM</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow" />
                <span className="text-xs mono text-muted-foreground">MEMORY_POOL</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-glow" />
                <span className="text-xs mono text-muted-foreground">OPTIMIZATION_ON</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-bold mono bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 bg-clip-text text-transparent">
              CACHE.MONITOR
            </h1>
            <p className="text-lg text-muted-foreground mono max-w-3xl tracking-wide">
              Memory Management • Cache Optimization • Performance Analytics • Resource Monitoring
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            onClick={handleClearCache}
            disabled={clearCacheMutation.isPending}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Cache
          </Button>
        </div>

        <Card className="modern-card overflow-hidden border-2 border-orange-200/60 dark:border-orange-800/30 bg-gradient-to-br from-orange-50/50 to-red-50/30 dark:from-orange-950/20 dark:to-red-950/10 backdrop-blur-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group">
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <HardDrive className="h-5 w-5 text-white drop-shadow-sm" />
              </div>
              <span>Cached Models</span>
              {cacheData && (
                <Badge variant="secondary">
                  {cacheData.count} models
                </Badge>
              )}
            </CardTitle>
            {/* Decorative gradient overlay */}
            <div className="absolute top-0 right-0 w-20 h-20 opacity-5 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 rounded-bl-full"></div>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : !cacheData?.cached_models || cacheData.cached_models.length === 0 ? (
              <div className="text-center py-8">
                <HardDrive className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">No models cached</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cacheData.cached_models.map((modelName) => (
                  <div key={modelName} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <HardDrive className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {modelName}
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
                      Cached
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
