import { useState } from "react";
import { Play, Copy, Check, Code, FileText, Zap, Terminal, Info, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDeepSeekModels, useDeepSeekGenerate } from "@/hooks/useDeepSeekAPI";
import { useNotifications } from "@/hooks/useNotifications";
import { DeepSeekGenerateRequest } from "@/lib/deepseek-api";

export default function DeepSeekApiDocs() {
  const [testRequest, setTestRequest] = useState<DeepSeekGenerateRequest>({
    model_name: "",
    prompt: "What is the capital of India?",
    max_tokens: 200,
    temperature: 0.7,
    n_ctx: 2048,
    n_threads: 8,
  });
  const [testResponse, setTestResponse] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: modelsData } = useDeepSeekModels();
  const generateMutation = useDeepSeekGenerate();
  const { addNotification } = useNotifications();

  const handleTest = async () => {
    if (!testRequest.model_name) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Please select a model to test with",
      });
      return;
    }

    try {
      const response = await generateMutation.mutateAsync(testRequest);
      setTestResponse(response);
      addNotification({
        type: "success",
        title: "Success",
        message: "API test completed successfully",
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to test API endpoint",
      });
    }
  };

  const copyToClipboard = async (text: string, codeType: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCode(codeType);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const curlExample = `curl -X POST http://localhost:5001/api/deepseek/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "model_name": "${testRequest.model_name || "DeepSeek-R1-q2_k.gguf"}",
    "prompt": "${testRequest.prompt}",
    "max_tokens": ${testRequest.max_tokens},
    "temperature": ${testRequest.temperature},
    "n_ctx": ${testRequest.n_ctx},
    "n_threads": ${testRequest.n_threads}
  }'`;

  const pythonExample = `import requests
import json

url = "http://localhost:5001/api/deepseek/generate"
headers = {"Content-Type": "application/json"}

data = {
    "model_name": "${testRequest.model_name || "DeepSeek-R1-q2_k.gguf"}",
    "prompt": "${testRequest.prompt}",
    "max_tokens": ${testRequest.max_tokens},
    "temperature": ${testRequest.temperature},
    "n_ctx": ${testRequest.n_ctx},
    "n_threads": ${testRequest.n_threads}
}

response = requests.post(url, headers=headers, json=data)
result = response.json()

if result["success"]:
    print("Generated text:", result["generated_text"])
else:
    print("Error:", result.get("error", "Unknown error"))`;

  const javascriptExample = `const response = await fetch('http://localhost:5001/api/deepseek/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model_name: '${testRequest.model_name || "DeepSeek-R1-q2_k.gguf"}',
    prompt: '${testRequest.prompt}',
    max_tokens: ${testRequest.max_tokens},
    temperature: ${testRequest.temperature},
    n_ctx: ${testRequest.n_ctx},
    n_threads: ${testRequest.n_threads}
  })
});

const result = await response.json();

if (result.success) {
  console.log('Generated text:', result.generated_text);
} else {
  console.error('Error:', result.error);
}`;

  const nodeExample = `const axios = require('axios');

const generateText = async () => {
  try {
    const response = await axios.post('http://localhost:5001/api/deepseek/generate', {
      model_name: '${testRequest.model_name || "DeepSeek-R1-q2_k.gguf"}',
      prompt: '${testRequest.prompt}',
      max_tokens: ${testRequest.max_tokens},
      temperature: ${testRequest.temperature},
      n_ctx: ${testRequest.n_ctx},
      n_threads: ${testRequest.n_threads}
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('Generated text:', response.data.generated_text);
    } else {
      console.error('Error:', response.data.error);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
};

generateText();`;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Compact Technical Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 p-4 sm:p-6 border border-purple-500/20">
        <div className="absolute inset-0 tech-grid opacity-10" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-xs text-purple-400 font-medium">
                DeepSeek API
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-xs text-muted-foreground">Port 5001</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-xs text-muted-foreground">
                  GGUF Models
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
              DeepSeek API Documentation
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              DeepSeek R1 API • Text Generation • Model Configuration • Integration Guide
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Documentation */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Quick Start */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-4 w-4" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">1. Start the API Server</h4>
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                  <code className="text-sm">
                    cd "d:\projects\Local LLM" && python main.py
                  </code>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">2. Quick Test</h4>
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                  <code className="text-sm">
                    curl -X POST http://localhost:5001/api/deepseek/test
                  </code>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">3. Generate Text</h4>
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
{`curl -X POST http://localhost:5001/api/deepseek/generate \\
  -H "Content-Type: application/json" \\
  -d '{"model_name": "DeepSeek-R1-q2_k.gguf", "prompt": "Hello, DeepSeek!"}'`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endpoints */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Terminal className="h-4 w-4" />
                API Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      GET
                    </Badge>
                    <code className="text-sm font-mono">/api/deepseek/health</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Check service health status</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      GET
                    </Badge>
                    <code className="text-sm font-mono">/api/deepseek/models</code>
                  </div>
                  <p className="text-sm text-muted-foreground">List all available models</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      GET
                    </Badge>
                    <code className="text-sm font-mono">/api/deepseek/models/{"{name}"}</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Get specific model information</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      POST
                    </Badge>
                    <code className="text-sm font-mono">/api/deepseek/generate</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Generate text using specified model</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      POST
                    </Badge>
                    <code className="text-sm font-mono">/api/deepseek/test</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Quick test with default parameters</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parameters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-4 w-4" />
                Generation Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-3">Required Parameters</h4>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <code className="text-sm font-mono text-purple-600 dark:text-purple-400">model_name</code>
                      <p className="text-xs text-muted-foreground mt-1">
                        Model file name (e.g., "DeepSeek-R1-q2_k.gguf")
                      </p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <code className="text-sm font-mono text-purple-600 dark:text-purple-400">prompt</code>
                      <p className="text-xs text-muted-foreground mt-1">
                        Input text for generation
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-3">Optional Parameters</h4>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <code className="text-sm font-mono text-blue-600 dark:text-blue-400">max_tokens</code>
                      <p className="text-xs text-muted-foreground mt-1">
                        50-500 (default: 200)
                      </p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <code className="text-sm font-mono text-blue-600 dark:text-blue-400">temperature</code>
                      <p className="text-xs text-muted-foreground mt-1">
                        0.1-1.0 (default: 0.7)
                      </p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <code className="text-sm font-mono text-blue-600 dark:text-blue-400">n_ctx</code>
                      <p className="text-xs text-muted-foreground mt-1">
                        512-4096 (default: 2048)
                      </p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <code className="text-sm font-mono text-blue-600 dark:text-blue-400">n_threads</code>
                      <p className="text-xs text-muted-foreground mt-1">
                        1-16 (default: 8)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-sm mb-3">Temperature Guide</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900">0.1-0.3</Badge>
                    <span className="text-sm">Focused, factual responses</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900">0.4-0.7</Badge>
                    <span className="text-sm">Balanced creativity and coherence</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900">0.8-1.0</Badge>
                    <span className="text-sm">Creative, varied responses</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Format */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-4 w-4" />
                Response Format
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-3">Success Response</h4>
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
{`{
  "success": true,
  "generated_text": "Generated content here...",
  "model": "DeepSeek-R1-q2_k.gguf",
  "prompt": "original prompt",
  "processing_time": 2.34,
  "tokens_generated": 150
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-3">Error Response</h4>
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
{`{
  "success": false,
  "error": "Error description",
  "model": "model_name"
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Code Examples */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code className="h-4 w-4" />
                Code Examples
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="curl" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="node">Node.js</TabsTrigger>
                </TabsList>

                <TabsContent value="curl" className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">cURL Example</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(curlExample, "curl")}
                    >
                      {copiedCode === "curl" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{curlExample}</pre>
                  </div>
                </TabsContent>

                <TabsContent value="python" className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Python Example</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(pythonExample, "python")}
                    >
                      {copiedCode === "python" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{pythonExample}</pre>
                  </div>
                </TabsContent>

                <TabsContent value="javascript" className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">JavaScript Example</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(javascriptExample, "javascript")}
                    >
                      {copiedCode === "javascript" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{javascriptExample}</pre>
                  </div>
                </TabsContent>

                <TabsContent value="node" className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Node.js Example</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(nodeExample, "node")}
                    >
                      {copiedCode === "node" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{nodeExample}</pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Live Testing & Model Guide */}
        <div className="space-y-4 sm:space-y-6">
          {/* API Testing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Play className="h-4 w-4" />
                Live API Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Make sure the DeepSeek API server is running on port 5001
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Model</label>
                  <Select
                    value={testRequest.model_name}
                    onValueChange={(value) =>
                      setTestRequest({ ...testRequest, model_name: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelsData?.models?.map((model) => (
                        <SelectItem key={model.name} value={model.name}>
                          {model.name}
                        </SelectItem>
                      )) || (
                        <SelectItem value="DeepSeek-R1-q2_k.gguf">
                          DeepSeek-R1-q2_k.gguf
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Prompt</label>
                  <Textarea
                    value={testRequest.prompt}
                    onChange={(e) =>
                      setTestRequest({ ...testRequest, prompt: e.target.value })
                    }
                    placeholder="Enter your prompt..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Max Tokens</label>
                    <Input
                      type="number"
                      value={testRequest.max_tokens}
                      onChange={(e) =>
                        setTestRequest({
                          ...testRequest,
                          max_tokens: parseInt(e.target.value) || 200,
                        })
                      }
                      min={1}
                      max={500}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Temperature</label>
                    <Input
                      type="number"
                      value={testRequest.temperature}
                      onChange={(e) =>
                        setTestRequest({
                          ...testRequest,
                          temperature: parseFloat(e.target.value) || 0.7,
                        })
                      }
                      min={0.1}
                      max={1}
                      step={0.1}
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleTest}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Test API
                    </>
                  )}
                </Button>
              </div>

              {testResponse && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Response:</h4>
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-x-auto">
                    <pre className="text-xs">{JSON.stringify(testResponse, null, 2)}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Model Selection Guide */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-4 w-4" />
                Model Selection Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      q2_k
                    </Badge>
                    <span className="text-xs text-muted-foreground">Smallest</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fastest speed, lower quality. Good for quick testing.
                  </p>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      q4_1
                    </Badge>
                    <span className="text-xs text-muted-foreground">Medium</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Balanced speed and quality. Good for general use.
                  </p>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      q4_k_m
                    </Badge>
                    <span className="text-xs text-muted-foreground">Recommended</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Best balance of speed and quality for most use cases.
                  </p>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      Q3_K_L
                    </Badge>
                    <span className="text-xs text-muted-foreground">Large</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Slower speed, highest quality. Best for important tasks.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-4 w-4" />
                Troubleshooting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Model not found</p>
                  <p className="text-xs text-muted-foreground">
                    Check model exists in DeepSeekLLM/model/
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="font-medium">Out of memory</p>
                  <p className="text-xs text-muted-foreground">
                    Use smaller model (q2_k) or reduce n_ctx
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="font-medium">Slow response</p>
                  <p className="text-xs text-muted-foreground">
                    Reduce max_tokens or increase n_threads
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="font-medium">Connection refused</p>
                  <p className="text-xs text-muted-foreground">
                    Verify port 5001 is available and server is running
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}