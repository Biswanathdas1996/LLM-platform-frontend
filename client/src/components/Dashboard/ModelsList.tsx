import { Box, Cloud, Trash2, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApiError } from '@/components/ui/api-error';
import { useModels, useDeleteModel } from '@/hooks/useLocalAPI';
import { useNotifications } from '@/hooks/useNotifications';

export function ModelsList() {
  const { data: modelsData, isLoading, error, refetch } = useModels();
  const deleteMutation = useDeleteModel();
  const { addNotification } = useNotifications();

  const handleDelete = async (modelName: string) => {
    try {
      await deleteMutation.mutateAsync(modelName);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Model deleted successfully',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete model',
      });
    }
  };

  if (error) {
    return (
      <div className="lg:col-span-2">
        <ApiError 
          error={error as Error} 
          onRetry={() => refetch()}
          title="Unable to Load Models"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 modern-card overflow-hidden border-2 border-purple-200/60 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 dark:from-purple-950/20 dark:to-indigo-950/10 backdrop-blur-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group">
      <CardHeader className="border-b border-purple-200/40 dark:border-purple-700/40 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <svg className="h-5 w-5 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            Available Models
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-5 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 rounded-bl-full"></div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {!modelsData?.models || modelsData.models.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-slate-500 dark:text-slate-400">No models available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {modelsData.models.map((model, index) => (
              <div 
                key={model.name} 
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 relative">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                          <Box className="h-4 w-4 text-white" />
                        </div>
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300 truncate">
                            {model.name}
                          </p>
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="text-xs text-muted-foreground font-medium">Active</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <span>Size:</span>
                            <span className="font-medium text-foreground">{model.size}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>Modified:</span>
                            <span className="font-medium text-foreground">{new Date(model.modified).toLocaleDateString()}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors duration-300"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                        Ready
                      </Badge>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(model.name)}
                        disabled={deleteMutation.isPending}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:scale-105"
                      >
                        {deleteMutation.isPending ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Progress bar for visual appeal */}
                  <div className="mt-3 w-full bg-muted/50 rounded-full h-1 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(85 + (index * 5), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
