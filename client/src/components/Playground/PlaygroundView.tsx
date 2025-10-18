import { useState } from 'react';
import { ConfigPanel } from './ConfigPanel';
import { ChatInterface } from './ChatInterface';

interface PlaygroundConfig {
  selectedModel: string;
  temperature: number;
  maxTokens: number | undefined;
  gpuLayers: number;
  selectedIndexes: string[];
}

export function PlaygroundView() {
  const [config, setConfig] = useState<PlaygroundConfig>({
    selectedModel: '',
    temperature: 0.7,
    maxTokens: undefined,
    gpuLayers: 40,
    selectedIndexes: [],
  });

  return (
    <div className="space-y-8">
      {/* Technical Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-emerald-500/10 p-8 border border-emerald-500/20">
        <div className="absolute inset-0 tech-grid opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-glow" />
              <span className="text-sm mono text-emerald-400 font-medium">PLAYGROUND_ACTIVE</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-glow" />
                <span className="text-xs mono text-muted-foreground">MODEL_READY</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-purple-400 shadow-glow" />
                <span className="text-xs mono text-muted-foreground">INTERFACE_LOADED</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-bold mono bg-gradient-to-r from-emerald-400 via-blue-500 to-emerald-400 bg-clip-text text-transparent">
              NEURAL.PLAYGROUND
            </h1>
            <p className="text-lg text-muted-foreground mono max-w-3xl tracking-wide">
              Interactive Model Testing Environment • Real-time Parameter Tuning • Advanced Prompt Engineering
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ConfigPanel config={config} onConfigChange={setConfig} />
        <ChatInterface {...config} />
      </div>
    </div>
  );
}
