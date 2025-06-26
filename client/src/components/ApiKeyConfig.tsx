import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, ExternalLink, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApiKeyConfigProps {
  onApiKeyChange?: (hasKey: boolean) => void;
}

export function ApiKeyConfig({ onApiKeyChange }: ApiKeyConfigProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Check if API key exists in environment or localStorage
    const envKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
    const storedKey = localStorage.getItem('huggingface_api_key');
    
    if (envKey || storedKey) {
      setIsSaved(true);
      onApiKeyChange?.(true);
    }
  }, [onApiKeyChange]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('huggingface_api_key', apiKey.trim());
      setIsSaved(true);
      setApiKey('');
      onApiKeyChange?.(true);
    }
  };

  const handleRemove = () => {
    localStorage.removeItem('huggingface_api_key');
    setIsSaved(false);
    setApiKey('');
    onApiKeyChange?.(false);
  };

  if (isSaved) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
            <Key className="h-4 w-4" />
            HuggingFace API Key Configured
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-green-600 dark:text-green-400 mb-3">
            Your API key is saved and ready for direct HuggingFace API calls.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
          >
            Remove API Key
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-orange-700 dark:text-orange-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          HuggingFace API Key Required
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <Alert>
          <AlertDescription className="text-sm">
            To use HuggingFace models, you need to provide your API key. The key is stored locally in your browser.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="api-key" className="text-sm font-medium">
            HuggingFace API Key
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={handleSave} disabled={!apiKey.trim()}>
              Save
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p>
            Don't have an API key?{' '}
            <a
              href="https://huggingface.co/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
            >
              Get one from HuggingFace
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          <p>Your API key is stored locally and never sent to our servers.</p>
        </div>
      </CardContent>
    </Card>
  );
}