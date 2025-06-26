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
    <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
          Configuration
        </CardTitle>
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
