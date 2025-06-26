import { useState, useEffect } from 'react';
import { Send, RefreshCw, Cpu, Zap, MessageSquare, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ApiError } from '@/components/ui/api-error';
import { huggingFaceApi, type HuggingFaceModel, type GenerateRequest, type PipelineRequest } from '@/lib/huggingface-api';

const PIPELINE_TASKS = [
  { value: 'text-generation', label: 'Text Generation', icon: FileText },
  { value: 'summarization', label: 'Summarization', icon: FileText },
  { value: 'translation', label: 'Translation', icon: FileText },
  { value: 'question-answering', label: 'Question Answering', icon: MessageSquare },
  { value: 'fill-mask', label: 'Fill Mask', icon: FileText },
  { value: 'sentiment-analysis', label: 'Sentiment Analysis', icon: MessageSquare },
];

interface GenerationResult {
  id: string;
  timestamp: Date;
  prompt: string;
  response: string;
  model_used: string;
  parameters: Record<string, any>;
  task?: string;
  processingTime?: number;
}

export default function HuggingFaceGeneration() {
  const [models, setModels] = useState<HuggingFaceModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GenerationResult[]>([]);

  // Generation Parameters
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [maxNewTokens, setMaxNewTokens] = useState([100]);
  const [temperature, setTemperature] = useState([0.7]);
  const [topP, setTopP] = useState([0.9]);
  const [topK, setTopK] = useState([50]);
  const [repetitionPenalty, setRepetitionPenalty] = useState([1.1]);
  const [doSample, setDoSample] = useState(true);

  // Pipeline Parameters
  const [selectedTask, setSelectedTask] = useState('text-generation');
  const [pipelineInputs, setPipelineInputs] = useState('');
  const [maxLength, setMaxLength] = useState([130]);
  const [minLength, setMinLength] = useState([30]);
  const [numReturnSequences, setNumReturnSequences] = useState([1]);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await huggingFaceApi.getModels();
      setModels(response.models);
      if (response.models.length > 0 && !selectedModel) {
        setSelectedModel(response.models[0].model_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch models');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedModel || !prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    
    const startTime = Date.now();
    
    try {
      const request: GenerateRequest = {
        model_id: selectedModel,
        prompt: prompt.trim(),
        max_new_tokens: maxNewTokens[0],
        temperature: temperature[0],
        do_sample: doSample,
        top_p: topP[0],
        top_k: topK[0],
        repetition_penalty: repetitionPenalty[0],
      };

      const response = await huggingFaceApi.generate(request);
      const processingTime = Date.now() - startTime;

      const result: GenerationResult = {
        id: Date.now().toString(),
        timestamp: new Date(),
        prompt: prompt.trim(),
        response: response.response,
        model_used: response.model_used,
        parameters: response.parameters,
        processingTime,
      };

      setResults(prev => [result, ...prev]);
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate text');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePipelineGenerate = async () => {
    if (!selectedModel || !pipelineInputs.trim()) return;

    setIsGenerating(true);
    setError(null);
    
    const startTime = Date.now();
    
    try {
      const request: PipelineRequest = {
        model_id: selectedModel,
        task: selectedTask,
        inputs: pipelineInputs.trim(),
        max_length: maxLength[0],
        min_length: minLength[0],
        do_sample: doSample,
        num_return_sequences: numReturnSequences[0],
      };

      const response = await huggingFaceApi.pipeline(request);
      const processingTime = Date.now() - startTime;

      const result: GenerationResult = {
        id: Date.now().toString(),
        timestamp: new Date(),
        prompt: pipelineInputs.trim(),
        response: response.results.map(r => r.generated_text).join('\n\n'),
        model_used: response.model_used,
        parameters: { task: selectedTask, max_length: maxLength[0], min_length: minLength[0] },
        task: selectedTask,
        processingTime,
      };

      setResults(prev => [result, ...prev]);
      setPipelineInputs('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate with pipeline');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const selectedModelInfo = models.find(m => m.model_id === selectedModel);

  if (error && models.length === 0) {
    return (
      <div className="p-6">
        <ApiError
          error={new Error(error)}
          onRetry={fetchModels}
          title="Failed to Connect to HuggingFace API"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Technical Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 p-8 border border-emerald-500/20">
        <div className="absolute inset-0 tech-grid opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-glow" />
              <span className="text-sm mono text-emerald-400 font-medium">HF_GENERATION</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-glow" />
                <span className="text-xs mono text-muted-foreground">INFERENCE_READY</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <Button 
                onClick={fetchModels} 
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
              HuggingFace Generation
            </h1>
            <p className="text-muted-foreground text-lg">
              Generate text, summaries, translations, and more using HuggingFace models
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card/50 backdrop-blur rounded-lg p-4 border border-border/50">
              <div className="text-2xl font-bold text-emerald-400">{models.length}</div>
              <div className="text-sm text-muted-foreground">Available Models</div>
            </div>
            <div className="bg-card/50 backdrop-blur rounded-lg p-4 border border-border/50">
              <div className="text-2xl font-bold text-cyan-400">{results.length}</div>
              <div className="text-sm text-muted-foreground">Generations</div>
            </div>
            <div className="bg-card/50 backdrop-blur rounded-lg p-4 border border-border/50">
              <div className="text-2xl font-bold text-purple-400">
                {selectedModelInfo?.model_type || '--'}
              </div>
              <div className="text-sm text-muted-foreground">Current Type</div>
            </div>
            <div className="bg-card/50 backdrop-blur rounded-lg p-4 border border-border/50">
              <div className="text-2xl font-bold text-pink-400">
                {results.length > 0 ? Math.round(results.reduce((sum, r) => sum + (r.processingTime || 0), 0) / results.length) : 0}ms
              </div>
              <div className="text-sm text-muted-foreground">Avg Time</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generation Interface */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate">Direct Generation</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline Tasks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="generate" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-emerald-400" />
                    Text Generation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="model-select">Model</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map(model => (
                          <SelectItem key={model.model_id} value={model.model_id}>
                            <div className="flex items-center gap-2">
                              <Badge className="text-xs" variant="outline">
                                {model.model_type}
                              </Badge>
                              {model.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="prompt">Prompt</Label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Enter your prompt here..."
                      rows={4}
                    />
                  </div>

                  <Button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !selectedModel || !prompt.trim()}
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Generate Text
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pipeline" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-cyan-400" />
                    Pipeline Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="model-select-pipeline">Model</Label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {models.map(model => (
                            <SelectItem key={model.model_id} value={model.model_id}>
                              <div className="flex items-center gap-2">
                                <Badge className="text-xs" variant="outline">
                                  {model.model_type}
                                </Badge>
                                {model.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="task-select">Task</Label>
                      <Select value={selectedTask} onValueChange={setSelectedTask}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a task" />
                        </SelectTrigger>
                        <SelectContent>
                          {PIPELINE_TASKS.map(task => (
                            <SelectItem key={task.value} value={task.value}>
                              <div className="flex items-center gap-2">
                                <task.icon className="h-4 w-4" />
                                {task.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pipeline-inputs">Input Text</Label>
                    <Textarea
                      id="pipeline-inputs"
                      value={pipelineInputs}
                      onChange={(e) => setPipelineInputs(e.target.value)}
                      placeholder="Enter text for the selected task..."
                      rows={4}
                    />
                  </div>

                  <Button 
                    onClick={handlePipelineGenerate}
                    disabled={isGenerating || !selectedModel || !pipelineInputs.trim()}
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Run Pipeline
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Parameters Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generation Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Max New Tokens: {maxNewTokens[0]}</Label>
                <Slider
                  value={maxNewTokens}
                  onValueChange={setMaxNewTokens}
                  max={500}
                  min={1}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Temperature: {temperature[0]}</Label>
                <Slider
                  value={temperature}
                  onValueChange={setTemperature}
                  max={2}
                  min={0}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Top P: {topP[0]}</Label>
                <Slider
                  value={topP}
                  onValueChange={setTopP}
                  max={1}
                  min={0}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Top K: {topK[0]}</Label>
                <Slider
                  value={topK}
                  onValueChange={setTopK}
                  max={100}
                  min={1}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Repetition Penalty: {repetitionPenalty[0]}</Label>
                <Slider
                  value={repetitionPenalty}
                  onValueChange={setRepetitionPenalty}
                  max={2}
                  min={1}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="do-sample"
                  checked={doSample}
                  onCheckedChange={setDoSample}
                />
                <Label htmlFor="do-sample">Use Sampling</Label>
              </div>

              {/* Pipeline specific parameters */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Pipeline Parameters</h4>
                
                <div>
                  <Label>Max Length: {maxLength[0]}</Label>
                  <Slider
                    value={maxLength}
                    onValueChange={setMaxLength}
                    max={512}
                    min={10}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Min Length: {minLength[0]}</Label>
                  <Slider
                    value={minLength}
                    onValueChange={setMinLength}
                    max={100}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Return Sequences: {numReturnSequences[0]}</Label>
                  <Slider
                    value={numReturnSequences}
                    onValueChange={setNumReturnSequences}
                    max={5}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Generation Results</h2>
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{result.model_used}</Badge>
                      {result.task && (
                        <Badge className="bg-cyan-500 text-white">{result.task}</Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {formatTimestamp(result.timestamp)}
                      </span>
                    </div>
                    {result.processingTime && (
                      <Badge variant="outline" className="text-emerald-600">
                        {result.processingTime}ms
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">PROMPT</Label>
                    <div className="mt-1 p-3 bg-muted/50 rounded-md text-sm">
                      {result.prompt}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">RESPONSE</Label>
                    <div className="mt-1 p-3 bg-card border rounded-md">
                      {result.response}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}