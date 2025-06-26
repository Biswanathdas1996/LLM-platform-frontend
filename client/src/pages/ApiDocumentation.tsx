import { useState } from 'react';
import { Play, Copy, Check, Code, FileText, Zap, Terminal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useModels, useGenerate } from '@/hooks/useLocalAPI';
import { useNotifications } from '@/hooks/useNotifications';

interface TestRequest {
  question: string;
  model_name: string;
  temperature?: number;
  n_gpu_layers?: number;
  n_batch?: number;
  template?: string;
}

export default function ApiDocumentation() {
  const [testRequest, setTestRequest] = useState<TestRequest>({
    question: 'What is the capital of India?',
    model_name: '',
    temperature: 0.7,
    n_gpu_layers: 10,
    n_batch: 512
  });
  const [testResponse, setTestResponse] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: modelsData } = useModels();
  const generateMutation = useGenerate();
  const { addNotification } = useNotifications();

  const handleTest = async () => {
    if (!testRequest.model_name) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Please select a model to test with'
      });
      return;
    }

    try {
      const response = await generateMutation.mutateAsync(testRequest);
      setTestResponse(response);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'API test completed successfully'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to test API endpoint'
      });
    }
  };

  const copyToClipboard = async (text: string, codeType: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCode(codeType);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const curlExample = `curl --location 'http://127.0.0.1:5000/api/v1/generate' \\
--header 'Content-Type: application/json' \\
--data '{
    "question": "What is the capital of India?",
    "model_name": "Llama-3.2-3B-Instruct-Q4_0",
    "temperature": 0.7,
    "n_gpu_layers": 10,
    "n_batch": 512
}'`;

  const javascriptExample = `// Using fetch API
const generateText = async () => {
  const response = await fetch('http://127.0.0.1:5000/api/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: "What is the capital of India?",
      model_name: "Llama-3.2-3B-Instruct-Q4_0",
      temperature: 0.7,
      n_gpu_layers: 10,
      n_batch: 512
    })
  });
  
  const data = await response.json();
  console.log(data);
};

// Using axios
import axios from 'axios';

const generateText = async () => {
  try {
    const response = await axios.post('http://127.0.0.1:5000/api/v1/generate', {
      question: "What is the capital of India?",
      model_name: "Llama-3.2-3B-Instruct-Q4_0",
      temperature: 0.7,
      n_gpu_layers: 10,
      n_batch: 512
    });
    
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
};`;

  const pythonExample = `import requests
import json

# Using requests library
def generate_text():
    url = "http://127.0.0.1:5000/api/v1/generate"
    
    payload = {
        "question": "What is the capital of India?",
        "model_name": "Llama-3.2-3B-Instruct-Q4_0",
        "temperature": 0.7,
        "n_gpu_layers": 10,
        "n_batch": 512
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"API call failed: {response.status_code}")

# Example usage
try:
    result = generate_text()
    print(json.dumps(result, indent=2))
except Exception as e:
    print(f"Error: {e}")

# Using aiohttp for async requests
import aiohttp
import asyncio

async def generate_text_async():
    url = "http://127.0.0.1:5000/api/v1/generate"
    
    payload = {
        "question": "What is the capital of India?",
        "model_name": "Llama-3.2-3B-Instruct-Q4_0",
        "temperature": 0.7,
        "n_gpu_layers": 10,
        "n_batch": 512
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload) as response:
            return await response.json()

# Run async example
# result = asyncio.run(generate_text_async())`;

  const nodeExample = `// Node.js with built-in fetch (Node 18+)
const generateText = async () => {
  try {
    const response = await fetch('http://127.0.0.1:5000/api/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: "What is the capital of India?",
        model_name: "Llama-3.2-3B-Instruct-Q4_0",
        temperature: 0.7,
        n_gpu_layers: 10,
        n_batch: 512
      })
    });
    
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Node.js with axios
const axios = require('axios');

const generateText = async () => {
  try {
    const response = await axios.post('http://127.0.0.1:5000/api/v1/generate', {
      question: "What is the capital of India?",
      model_name: "Llama-3.2-3B-Instruct-Q4_0",
      temperature: 0.7,
      n_gpu_layers: 10,
      n_batch: 512
    });
    
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};`;

  const phpExample = `<?php
// Using cURL
function generateText() {
    $url = 'http://127.0.0.1:5000/api/v1/generate';
    
    $data = array(
        'question' => 'What is the capital of India?',
        'model_name' => 'Llama-3.2-3B-Instruct-Q4_0',
        'temperature' => 0.7,
        'n_gpu_layers' => 10,
        'n_batch' => 512
    );
    
    $curl = curl_init();
    
    curl_setopt_array($curl, array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json'
        ),
    ));
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    
    curl_close($curl);
    
    if ($httpCode === 200) {
        return json_decode($response, true);
    } else {
        throw new Exception("API call failed: HTTP $httpCode");
    }
}

// Example usage
try {
    $result = generateText();
    echo json_encode($result, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>`;

  return (
    <div className="space-y-8">
      {/* Technical Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 p-8 border border-emerald-500/20">
        <div className="absolute inset-0 tech-grid opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-glow" />
              <span className="text-sm text-emerald-400 font-medium">API_DOCS</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-glow" />
                <span className="text-xs text-muted-foreground">REST_API</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-glow" />
                <span className="text-xs text-muted-foreground">JSON_FORMAT</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400 bg-clip-text text-transparent">
              API.DOCS
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl tracking-wide">
              Generate API Documentation • Integration Guide • Code Examples • Live Testing
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Documentation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Endpoint Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Text Endpoint
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    POST
                  </Badge>
                  <code className="text-sm font-mono">http://127.0.0.1:5000/api/v1/generate</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  Generate text using a specified LLM model with configurable parameters.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Request Headers</h4>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                  <code className="text-sm">Content-Type: application/json</code>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Request Body Parameters</h4>
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono text-blue-600 dark:text-blue-400">question</code>
                      <Badge variant="destructive" className="text-xs">required</Badge>
                      <Badge variant="secondary" className="text-xs">string</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">The text prompt or question to generate a response for.</p>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono text-blue-600 dark:text-blue-400">model_name</code>
                      <Badge variant="destructive" className="text-xs">required</Badge>
                      <Badge variant="secondary" className="text-xs">string</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Name of the model to use for generation.</p>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono text-blue-600 dark:text-blue-400">temperature</code>
                      <Badge variant="outline" className="text-xs">optional</Badge>
                      <Badge variant="secondary" className="text-xs">number</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Controls randomness (0.0-1.0). Default: 0.7</p>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono text-blue-600 dark:text-blue-400">n_gpu_layers</code>
                      <Badge variant="outline" className="text-xs">optional</Badge>
                      <Badge variant="secondary" className="text-xs">number</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Number of GPU layers to use. Default: 10</p>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono text-blue-600 dark:text-blue-400">n_batch</code>
                      <Badge variant="outline" className="text-xs">optional</Badge>
                      <Badge variant="secondary" className="text-xs">number</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Batch size for processing. Default: 512</p>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono text-blue-600 dark:text-blue-400">template</code>
                      <Badge variant="outline" className="text-xs">optional</Badge>
                      <Badge variant="secondary" className="text-xs">string</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Custom prompt template for the model.</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Response Format</h4>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                  <pre className="text-sm">
{`{
  "success": true,
  "response": "New Delhi is the capital of India.",
  "model_used": "Llama-3.2-3B-Instruct-Q4_0",
  "processing_time": 2.45,
  "token_count": 12
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Code Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Code Examples
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="curl" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="nodejs">Node.js</TabsTrigger>
                  <TabsTrigger value="php">PHP</TabsTrigger>
                </TabsList>

                <TabsContent value="curl" className="space-y-4">
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(curlExample, 'curl')}
                    >
                      {copiedCode === 'curl' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{curlExample}</code>
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="javascript" className="space-y-4">
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(javascriptExample, 'javascript')}
                    >
                      {copiedCode === 'javascript' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96 overflow-y-auto">
                      <code>{javascriptExample}</code>
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="python" className="space-y-4">
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(pythonExample, 'python')}
                    >
                      {copiedCode === 'python' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96 overflow-y-auto">
                      <code>{pythonExample}</code>
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="nodejs" className="space-y-4">
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(nodeExample, 'nodejs')}
                    >
                      {copiedCode === 'nodejs' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96 overflow-y-auto">
                      <code>{nodeExample}</code>
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="php" className="space-y-4">
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(phpExample, 'php')}
                    >
                      {copiedCode === 'php' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm max-h-96 overflow-y-auto">
                      <code>{phpExample}</code>
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Live Testing Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Live API Tester
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Question</label>
                <Textarea
                  value={testRequest.question}
                  onChange={(e) => setTestRequest({ ...testRequest, question: e.target.value })}
                  placeholder="Enter your question or prompt..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Model</label>
                <Select
                  value={testRequest.model_name}
                  onValueChange={(value) => setTestRequest({ ...testRequest, model_name: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelsData?.models.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Temperature</label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={testRequest.temperature}
                  onChange={(e) => setTestRequest({ ...testRequest, temperature: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">GPU Layers</label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={testRequest.n_gpu_layers}
                  onChange={(e) => setTestRequest({ ...testRequest, n_gpu_layers: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Batch Size</label>
                <Input
                  type="number"
                  min="1"
                  max="2048"
                  value={testRequest.n_batch}
                  onChange={(e) => setTestRequest({ ...testRequest, n_batch: parseInt(e.target.value) })}
                />
              </div>

              <Button
                onClick={handleTest}
                disabled={generateMutation.isPending || !testRequest.model_name}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {generateMutation.isPending ? 'Testing...' : 'Test API'}
              </Button>
            </CardContent>
          </Card>

          {/* Test Response */}
          {testResponse && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={testResponse.success ? "default" : "destructive"}>
                      {testResponse.success ? 'Success' : 'Error'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {testResponse.processing_time?.toFixed(2)}s
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">Generated Text:</p>
                    <p className="text-sm">
                      {typeof testResponse.response === 'string' 
                        ? testResponse.response 
                        : JSON.stringify(testResponse.response)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium">Model:</span>
                      <p className="truncate">{String(testResponse.model_used || 'N/A')}</p>
                    </div>
                    <div>
                      <span className="font-medium">Tokens:</span>
                      <p>{String(testResponse.token_count || 0)}</p>
                    </div>
                  </div>

                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">Raw JSON Response</summary>
                    <pre className="bg-slate-900 text-slate-100 p-2 rounded mt-2 overflow-x-auto">
                      {JSON.stringify(testResponse, null, 2)}
                    </pre>
                  </details>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}