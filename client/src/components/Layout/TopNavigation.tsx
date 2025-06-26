import { Brain, Moon, Sun, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useHealth } from '@/hooks/useLocalAPI';

export function TopNavigation() {
  const { theme, toggleTheme } = useTheme();
  const { data: health, isLoading: healthLoading } = useHealth();

  const isHealthy = health?.status === 'healthy';

  return (
    <nav className="glass-effect border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center group">
              <div className="relative">
                <Brain className="text-primary h-8 w-8 mr-4 transition-all duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  LLM Platform
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Advanced AI Model Management
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                healthLoading 
                  ? 'bg-amber-400 animate-pulse' 
                  : isHealthy 
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' 
                    : 'bg-red-400 shadow-sm shadow-red-400/50'
              }`} />
              <span className="text-sm font-medium text-foreground">
                {healthLoading 
                  ? 'Checking...' 
                  : isHealthy 
                    ? 'API Connected' 
                    : 'API Disconnected'
                }
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-10 w-10 rounded-full bg-muted/50 hover:bg-muted border border-border/50 hover:border-border transition-all duration-200 hover:scale-105"
              >
                {theme === 'dark' ? 
                  <Sun className="h-4 w-4 text-amber-500" /> : 
                  <Moon className="h-4 w-4 text-blue-600" />
                }
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 rounded-full bg-muted/50 hover:bg-muted border border-border/50 hover:border-border transition-all duration-200 hover:scale-105"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
