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
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Cache Status
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Monitor and manage model cache
        </p>
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

        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5" />
              <span>Cached Models</span>
              {cacheData && (
                <Badge variant="secondary">
                  {cacheData.count} models
                </Badge>
              )}
            </CardTitle>
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
