import { useState } from 'react';
import { ConfigPanel } from './ConfigPanel';
import { ChatInterface } from './ChatInterface';

interface PlaygroundConfig {
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  gpuLayers: number;
}

export function PlaygroundView() {
  const [config, setConfig] = useState<PlaygroundConfig>({
    selectedModel: '',
    temperature: 0.7,
    maxTokens: 512,
    gpuLayers: 40,
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Playground
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Test your models with custom prompts and parameters
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ConfigPanel config={config} onConfigChange={setConfig} />
        <ChatInterface {...config} />
      </div>
    </div>
  );
}
