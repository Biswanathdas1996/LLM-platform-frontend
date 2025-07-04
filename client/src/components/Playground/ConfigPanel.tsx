import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useModels } from '@/hooks/useLocalAPI';

interface PlaygroundConfig {
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  gpuLayers: number;
}

interface ConfigPanelProps {
  config: PlaygroundConfig;
  onConfigChange: (config: PlaygroundConfig) => void;
}

export function ConfigPanel({ config, onConfigChange }: ConfigPanelProps) {
  const { data: modelsData } = useModels();

  const updateConfig = (updates: Partial<PlaygroundConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <Card className="modern-card overflow-hidden border-2 border-emerald-200/60 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 backdrop-blur-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group">
      <CardHeader className="relative">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
            <svg className="h-5 w-5 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
          Configuration
        </CardTitle>
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-5 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-bl-full"></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Model
          </Label>
          <Select 
            value={config.selectedModel} 
            onValueChange={(value) => updateConfig({ selectedModel: value })}
          >
            <SelectTrigger className="w-full bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <SelectValue placeholder="Select a model..." />
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
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Temperature
          </Label>
          <Slider
            value={[config.temperature]}
            onValueChange={(value) => updateConfig({ temperature: value[0] })}
            max={2}
            min={0}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>0</span>
            <span>{config.temperature}</span>
            <span>2</span>
          </div>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Max Tokens
          </Label>
          <Input
            type="number"
            value={config.maxTokens}
            onChange={(e) => updateConfig({ maxTokens: parseInt(e.target.value) || 512 })}
            className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>
        
        <div>
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            GPU Layers
          </Label>
          <Input
            type="number"
            value={config.gpuLayers}
            onChange={(e) => updateConfig({ gpuLayers: parseInt(e.target.value) || 40 })}
            className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>
      </CardContent>
    </Card>
  );
}
