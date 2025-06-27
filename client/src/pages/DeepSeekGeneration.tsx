import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Brain, CheckCircle, Clock, Copy, Loader2, Play, Zap, Server } from 'lucide-react';
import { useDeepSeekHealth, useDeepSeekModels, useDeepSeekGenerate, useDeepSeekQuickTest } from '@/hooks/useDeepSeekAPI';
import { useNotifications } from '@/hooks/useNotifications';
import { DeepSeekGenerateRequest } from '@/lib/deepseek-api';

interface GenerationResult {
  id: string;
  timestamp: Date;
  prompt: string;
  response: string;
  model: string;
  parameters: Record<string, any>;
  processingTime?: number;
  tokensGenerated?: number;
}

export default function DeepSeekGeneration() {
  // Generation form state
  const [generateRequest, setGenerateRequest] = useState<DeepSeekGenerateRequest>({
    model_name: '',
    prompt: 'What is artificial intelligence?',
    max_tokens: 200,
    temperature: 0.7,
    n_ctx: 2048,
    n_threads: 8,
  });

  // Results state
  const [results, setResults] = useState<GenerationResult[]>([]);

  // Hooks
  const { data: healthData, isLoading: healthLoading } = useDeepSeekHealth();
  const { data: modelsData, isLoading: modelsLoading } = useDeepSeekModels();
  const generateMutation = useDeepSeekGenerate();
  const quickTestMutation = useDeepSeekQuickTest();
  const { addNotification } = useNotifications();

  const handleGenerate = async () => {
    if (!generateRequest.model_name || !generateRequest.prompt.trim()) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a model and enter a prompt',
      });
      return;
    }

    try {
      const response = await generateMutation.mutateAsync(generateRequest);
      
      if (response.success) {
        const result: GenerationResult = {
          id: Date.now().toString(),
          timestamp: new Date(),
          prompt: generateRequest.prompt,
          response: response.generated_text,
          model: response.model,
          parameters: {
            max_tokens: generateRequest.max_tokens,
            temperature: generateRequest.temperature,
            n_ctx: generateRequest.n_ctx,
            n_threads: generateRequest.n_threads,
          },
          processingTime: response.processing_time,
          tokensGenerated: response.tokens_generated,
        };

        setResults(prev => [result, ...prev]);
        addNotification({
          type: 'success',
          title: 'Generation Complete',
          message: `Generated ${response.tokens_generated || 'text'} tokens`,
        });
      } else {
        throw new Error(response.error || 'Generation failed');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  const handleQuickTest = async () => {
    try {
      const response = await quickTestMutation.mutateAsync();
      
      if (response.success) {
        const result: GenerationResult = {
          id: Date.now().toString(),
          timestamp: new Date(),
          prompt: response.prompt,
          response: response.generated_text,
          model: response.model,
          parameters: { quick_test: true },
          processingTime: response.processing_time,
          tokensGenerated: response.tokens_generated,
        };

        setResults(prev => [result, ...prev]);
        addNotification({
          type: 'success',
          title: 'Quick Test Complete',
          message: 'DeepSeek API is working correctly',
        });
      } else {
        throw new Error(response.error || 'Quick test failed');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Quick Test Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addNotification({
      type: 'success',
      title: 'Copied',
      message: 'Text copied to clipboard',
    });
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString();
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
              <span className="text-xs text-purple-400 font-medium">DeepSeek R1</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-xs text-muted-foreground">Port 5001</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-muted-foreground">Local API</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
              DeepSeek Generation
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Advanced Text Generation • DeepSeek R1 Models • Local Processing • Performance Optimized
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Generation Interface */}
        <div className="space-y-4 sm:space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-4 w-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  onClick={handleQuickTest}
                  disabled={quickTestMutation.isPending}
                  className="flex-1"
                  variant="outline"
                >
                  {quickTestMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Quick Test
                    </>
                  )}
                </Button>
                <Badge variant={healthData?.status === 'healthy' ? 'default' : 'destructive'} className="px-3">
                  {healthLoading ? 'Checking...' : healthData?.status || 'Unknown'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Generation Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-4 w-4" />
                Text Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Model Selection */}
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select
                  value={generateRequest.model_name}
                  onValueChange={(value) => setGenerateRequest(prev => ({ ...prev, model_name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {modelsLoading ? (
                      <SelectItem value="loading" disabled>Loading models...</SelectItem>
                    ) : modelsData?.models?.length ? (
                      modelsData.models.map((model) => (
                        <SelectItem key={model.name} value={model.name}>
                          {model.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-models" disabled>No models available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Prompt Input */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Enter your prompt here..."
                  value={generateRequest.prompt}
                  onChange={(e) => setGenerateRequest(prev => ({ ...prev, prompt: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Parameters */}
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max_tokens">Max Tokens</Label>
                      <Input
                        id="max_tokens"
                        type="number"
                        min="1"
                        max="500"
                        value={generateRequest.max_tokens}
                        onChange={(e) => setGenerateRequest(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 200 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature</Label>
                      <Input
                        id="temperature"
                        type="number"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={generateRequest.temperature}
                        onChange={(e) => setGenerateRequest(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="n_ctx">Context Size</Label>
                      <Input
                        id="n_ctx"
                        type="number"
                        min="512"
                        max="4096"
                        value={generateRequest.n_ctx}
                        onChange={(e) => setGenerateRequest(prev => ({ ...prev, n_ctx: parseInt(e.target.value) || 2048 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="n_threads">Threads</Label>
                      <Input
                        id="n_threads"
                        type="number"
                        min="1"
                        max="16"
                        value={generateRequest.n_threads}
                        onChange={(e) => setGenerateRequest(prev => ({ ...prev, n_threads: parseInt(e.target.value) || 8 }))}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !generateRequest.model_name || !generateRequest.prompt.trim()}
                className="w-full"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generate Text
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-4 w-4" />
                Generation Results
                {results.length > 0 && (
                  <Badge variant="secondary">{results.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No generations yet. Start by generating some text!</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {results.map((result) => (
                    <div key={result.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{result.model}</Badge>
                          {result.processingTime && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {result.processingTime.toFixed(2)}s
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(result.response)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Prompt:</Label>
                          <p className="text-sm bg-muted p-2 rounded text-muted-foreground">
                            {result.prompt}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Response:</Label>
                          <p className="text-sm whitespace-pre-wrap">{result.response}</p>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {formatTimestamp(result.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}