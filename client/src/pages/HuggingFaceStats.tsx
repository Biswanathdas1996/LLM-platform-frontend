import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, BarChart3, Cpu, HardDrive, Zap, TrendingUp, Users, Clock, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiError } from '@/components/ui/api-error';
import { huggingFaceApi, type HuggingFaceModel } from '@/lib/huggingface-api';

interface StatisticsData {
  total_models: number;
  total_usage: number;
  model_types: Record<string, number>;
  last_updated: string;
  most_used: {
    model_id: string;
    name: string;
    usage_count: number;
  };
}

interface CacheData {
  cached_models: Record<string, {
    loaded_at: string;
    device: string;
    model_type: string;
  }>;
  cached_pipelines: string[];
  total_cached: number;
}

interface DependenciesData {
  transformers: boolean;
  torch: boolean;
  cuda_available: boolean;
}

export default function HuggingFaceStats() {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [cacheInfo, setCacheInfo] = useState<CacheData | null>(null);
  const [dependencies, setDependencies] = useState<DependenciesData | null>(null);
  const [models, setModels] = useState<HuggingFaceModel[]>([]);
  const [modelTypes, setModelTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsResponse, cacheResponse, depsResponse, modelsResponse, typesResponse] = await Promise.all([
        huggingFaceApi.getStatistics().catch(() => null),
        huggingFaceApi.getCacheInfo().catch(() => null),
        huggingFaceApi.getDependencies().catch(() => null),
        huggingFaceApi.getModels().catch(() => ({ models: [] })),
        huggingFaceApi.getModelTypes().catch(() => ({ model_types: [] })),
      ]);

      if (statsResponse?.success) setStatistics(statsResponse.statistics);
      if (cacheResponse?.success) setCacheInfo(cacheResponse);
      if (depsResponse?.success) setDependencies(depsResponse.dependencies);
      if (modelsResponse) setModels(modelsResponse.models || []);
      if (typesResponse && 'success' in typesResponse && typesResponse.success) {
        setModelTypes(typesResponse.model_types);
      } else if (typesResponse && 'model_types' in typesResponse) {
        setModelTypes(typesResponse.model_types);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async (modelId?: string) => {
    setIsClearing(true);
    try {
      await huggingFaceApi.clearCache(modelId);
      await fetchAllData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
    } finally {
      setIsClearing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModelTypeDistribution = () => {
    if (!statistics?.model_types) return [];
    const total = Object.values(statistics.model_types).reduce((sum, count) => sum + count, 0);
    return Object.entries(statistics.model_types).map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  };

  const getUsageDistribution = () => {
    return models.map(model => ({
      name: model.name,
      model_id: model.model_id,
      usage_count: model.usage_count,
      last_used: model.last_used
    })).sort((a, b) => b.usage_count - a.usage_count);
  };

  if (error && !statistics && !cacheInfo) {
    return (
      <div className="p-6">
        <ApiError
          error={new Error(error)}
          onRetry={fetchAllData}
          title="Failed to Connect to HuggingFace API"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Technical Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 p-8 border border-orange-500/20">
        <div className="absolute inset-0 tech-grid opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shadow-glow" />
              <span className="text-sm mono text-orange-400 font-medium">HF_MONITOR</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow" />
                <span className="text-xs mono text-muted-foreground">TELEMETRY_ON</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <Button 
                onClick={fetchAllData} 
                disabled={isLoading}
                className="tech-button h-9 px-4"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="mono">REFRESH</span>
              </Button>
            </div>
          </div>
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold gradient-text mb-2">
              HuggingFace Statistics
            </h1>
            <p className="text-muted-foreground text-lg">
              Monitor performance, cache usage, and model statistics
            </p>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card/50 backdrop-blur rounded-lg p-4 border border-border/50">
              <div className="text-2xl font-bold text-orange-400">{statistics?.total_models || models.length}</div>
              <div className="text-sm text-muted-foreground">Total Models</div>
            </div>
            <div className="bg-card/50 backdrop-blur rounded-lg p-4 border border-border/50">
              <div className="text-2xl font-bold text-red-400">{statistics?.total_usage || models.reduce((sum, m) => sum + m.usage_count, 0)}</div>
              <div className="text-sm text-muted-foreground">Total Usage</div>
            </div>
            <div className="bg-card/50 backdrop-blur rounded-lg p-4 border border-border/50">
              <div className="text-2xl font-bold text-cyan-400">{cacheInfo?.total_cached || 0}</div>
              <div className="text-sm text-muted-foreground">Cached Models</div>
            </div>
            <div className="bg-card/50 backdrop-blur rounded-lg p-4 border border-border/50">
              <div className="text-2xl font-bold text-purple-400">{modelTypes.length}</div>
              <div className="text-sm text-muted-foreground">Model Types</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage Stats</TabsTrigger>
          <TabsTrigger value="cache">Cache Management</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-400" />
                  Model Types Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-2 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getModelTypeDistribution().map((item) => (
                      <div key={item.type} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="capitalize">
                            {item.type.replace('-', ' ')}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Most Used Model */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-red-400" />
                  Most Used Model
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </div>
                ) : statistics?.most_used ? (
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">{statistics.most_used.name}</h4>
                      <p className="text-sm text-muted-foreground font-mono">
                        {statistics.most_used.model_id}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-400" />
                      <span className="text-2xl font-bold text-green-400">
                        {statistics.most_used.usage_count}
                      </span>
                      <span className="text-sm text-muted-foreground">uses</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No usage data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4">
                      <div className="h-10 w-10 bg-muted rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {models.filter(m => m.last_used).sort((a, b) => 
                    new Date(b.last_used!).getTime() - new Date(a.last_used!).getTime()
                  ).slice(0, 5).map((model) => (
                    <div key={model.model_id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                        <Cpu className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{model.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Last used: {model.last_used ? formatDate(model.last_used) : 'Never'}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {model.usage_count} uses
                      </Badge>
                    </div>
                  ))}
                  {models.filter(m => m.last_used).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent activity
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                Model Usage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-3 rounded">
                      <div className="flex items-center gap-3">
                        <div className="h-4 bg-muted rounded w-32"></div>
                        <div className="h-3 bg-muted rounded w-20"></div>
                      </div>
                      <div className="h-6 bg-muted rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {getUsageDistribution().map((model) => (
                    <div key={model.model_id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <Cpu className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{model.name}</h4>
                          <p className="text-sm text-muted-foreground font-mono">{model.model_id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-400">{model.usage_count}</div>
                        <div className="text-xs text-muted-foreground">
                          {model.last_used ? formatDate(model.last_used) : 'Never used'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {models.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No models available
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cached Models */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-cyan-400" />
                  Cached Models
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center justify-between p-3 rounded">
                        <div className="h-4 bg-muted rounded w-32"></div>
                        <div className="h-8 bg-muted rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : cacheInfo?.cached_models && Object.keys(cacheInfo.cached_models).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(cacheInfo.cached_models).map(([modelId, info]) => (
                      <div key={modelId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <h4 className="font-semibold">{modelId}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {info.device}
                            </Badge>
                            <span>{formatDate(info.loaded_at)}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleClearCache(modelId)}
                          disabled={isClearing}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No models cached
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cache Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-400" />
                  Cache Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Cache Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Cached:</span>
                      <div className="text-2xl font-bold text-cyan-400">
                        {cacheInfo?.total_cached || 0}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pipelines:</span>
                      <div className="text-2xl font-bold text-purple-400">
                        {cacheInfo?.cached_pipelines?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={() => handleClearCache()}
                    disabled={isClearing || !cacheInfo?.total_cached}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                  >
                    {isClearing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All Cache
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-emerald-400" />
                System Dependencies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-3 rounded">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-6 bg-muted rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : dependencies ? (
                <div className="space-y-4">
                  {Object.entries(dependencies).map(([key, available]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="font-semibold capitalize">
                        {key.replace('_', ' ')}
                      </span>
                      <Badge 
                        className={available 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                        }
                      >
                        {available ? 'Available' : 'Not Available'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Unable to check dependencies
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Summary */}
          <Card>
            <CardHeader>
              <CardTitle>System Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
                  <div className="text-2xl font-bold text-emerald-400 mb-1">
                    {dependencies?.transformers ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-muted-foreground">Transformers</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                  <div className="text-2xl font-bold text-orange-400 mb-1">
                    {dependencies?.torch ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-muted-foreground">PyTorch</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {dependencies?.cuda_available ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-muted-foreground">CUDA</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}