import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Box, CheckCircle, Download, HardDrive, RefreshCw, Server } from 'lucide-react';
import { useDeepSeekHealth, useDeepSeekModels } from '@/hooks/useDeepSeekAPI';

export default function DeepSeekModels() {
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useDeepSeekHealth();
  const { data: modelsData, isLoading: modelsLoading, refetch: refetchModels } = useDeepSeekModels();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-blue-500';
      case 'loaded':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'loaded':
        return 'Loaded';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const formatFileSize = (sizeStr: string) => {
    // If it's already formatted, return as is
    if (sizeStr.includes('MB') || sizeStr.includes('GB') || sizeStr.includes('KB')) {
      return sizeStr;
    }
    
    // Otherwise try to parse as bytes and format
    const bytes = parseInt(sizeStr);
    if (isNaN(bytes)) return sizeStr;
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getHealthStatusColor = () => {
    if (healthLoading) return 'bg-yellow-500';
    if (healthData?.status === 'healthy') return 'bg-green-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Technical Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 p-4 sm:p-6 border border-purple-500/20">
        <div className="absolute inset-0 tech-grid opacity-10" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30">
              <div className={`w-1.5 h-1.5 rounded-full ${getHealthStatusColor()} animate-pulse`} />
              <span className="text-xs text-purple-400 font-medium">DeepSeek Models</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-xs text-muted-foreground">Local Storage</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-muted-foreground">GGUF Format</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
              DeepSeek Models
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Model Repository • GGUF Models • Local Storage • Performance Monitoring
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Service Status */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Server className="h-4 w-4" />
                Service Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Health Status</span>
                <Badge variant={healthData?.status === 'healthy' ? 'default' : 'destructive'}>
                  {healthLoading ? 'Checking...' : healthData?.status || 'Unknown'}
                </Badge>
              </div>
              
              {healthData && (
                <>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Service</span>
                      <span>{healthData.service}</span>
                    </div>
                    {healthData.version && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Version</span>
                        <span>{healthData.version}</span>
                      </div>
                    )}
                    {healthData.uptime && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Uptime</span>
                        <span>{healthData.uptime}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchHealth()}
                  disabled={healthLoading}
                  className="flex-1"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${healthLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Models List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Box className="h-4 w-4" />
                  Available Models
                  {modelsData?.count !== undefined && (
                    <Badge variant="secondary">{modelsData.count}</Badge>
                  )}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchModels()}
                  disabled={modelsLoading}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${modelsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {modelsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading models...</span>
                </div>
              ) : modelsData?.models?.length ? (
                <div className="space-y-3">
                  {modelsData.models.map((model, index) => (
                    <div
                      key={model.name}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium truncate">{model.name}</h3>
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(model.status)}`} />
                              <Badge variant="outline" className="text-xs">
                                {getStatusText(model.status)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              <span>{formatFileSize(model.size)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>Modified: {model.modified}</span>
                            </div>
                          </div>
                          
                          {model.path && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              Path: {model.path}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No models found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Make sure the DeepSeek API server is running and models are available in the model directory.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Model Guide */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="h-4 w-4" />
            Model Selection Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">q2_k</Badge>
              <div className="text-sm">
                <p className="font-medium">Smallest Size</p>
                <p className="text-muted-foreground">Fastest speed, lower quality. Good for quick testing and simple tasks.</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">q4_1</Badge>
              <div className="text-sm">
                <p className="font-medium">Medium Size</p>
                <p className="text-muted-foreground">Balanced speed and quality. Good for general purpose use.</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">q4_k_m</Badge>
              <div className="text-sm">
                <p className="font-medium">Recommended</p>
                <p className="text-muted-foreground">Best balance of speed and quality. Recommended for most use cases.</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Q3_K_L</Badge>
              <div className="text-sm">
                <p className="font-medium">Large Size</p>
                <p className="text-muted-foreground">Slower speed, highest quality. Best for important tasks.</p>
              </div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-sm text-muted-foreground">
            <h4 className="font-medium text-foreground mb-2">Setup Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Download DeepSeek R1 models in GGUF format</li>
              <li>Place models in the <code className="bg-muted px-1 rounded">DeepSeekLLM/model/</code> directory</li>
              <li>Start the API server with <code className="bg-muted px-1 rounded">python main.py</code></li>
              <li>Models will be automatically detected and available for use</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}