import { Brain, Moon, Sun, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useHealth } from '@/hooks/useLocalAPI';

export function TopNavigation() {
  const { theme, toggleTheme } = useTheme();
  const { data: health, isLoading: healthLoading } = useHealth();

  const isHealthy = health?.status === 'healthy';

  return (
    <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Brain className="text-blue-500 h-8 w-8 mr-3" />
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                LLM Platform
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                healthLoading 
                  ? 'bg-amber-400' 
                  : isHealthy 
                    ? 'bg-emerald-400' 
                    : 'bg-red-400'
              }`} />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {healthLoading 
                  ? 'Checking...' 
                  : isHealthy 
                    ? 'API Connected' 
                    : 'API Disconnected'
                }
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
