import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ApiErrorProps {
  error: Error | null;
  onRetry?: () => void;
  title?: string;
}

export function ApiError({ error, onRetry, title = "Connection Error" }: ApiErrorProps) {
  const isConnectionError = error?.message.includes('Local LLM API is not running');
  
  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
      <CardContent className="flex items-center space-x-4 p-6">
        <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
            {title}
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
            {isConnectionError 
              ? "The local LLM API service is not running. Please start it on port 5001 to use model features."
              : error?.message || "An error occurred while connecting to the API."
            }
          </p>
          {isConnectionError && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              You can still configure external APIs in the meantime.
            </p>
          )}
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="border-amber-300 dark:border-amber-600 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}