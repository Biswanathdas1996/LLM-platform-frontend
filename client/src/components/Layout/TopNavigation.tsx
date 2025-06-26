import { Brain, Moon, Sun, Settings, Activity, Cpu, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useHealth } from '@/hooks/useLocalAPI';

export function TopNavigation() {
  const { theme, toggleTheme } = useTheme();
  const { data: health, isLoading: healthLoading } = useHealth();

  const isHealthy = health?.status === 'healthy';

  return (
    <nav className="border-b bg-card/80 bg-pattern-dots backdrop-blur-md sticky top-0 z-50 h-12 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-card/60 via-card/40 to-card/60" />
      <div className="max-w-7xl mx-auto px-4 h-full relative z-10">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Brain className="text-primary h-5 w-5" />
              <h1 className="text-lg font-semibold text-foreground">LLM Platform</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* API Status */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-md bg-muted/50">
              <div className={`w-2 h-2 rounded-full ${
                healthLoading 
                  ? 'bg-amber-400 animate-pulse' 
                  : isHealthy 
                    ? 'bg-emerald-400' 
                    : 'bg-red-400'
              }`} />
              <span className="text-sm text-muted-foreground">
                {healthLoading ? 'Checking' : isHealthy ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {/* Controls */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 rounded-md"
              >
                {theme === 'dark' ? 
                  <Sun className="h-4 w-4" /> : 
                  <Moon className="h-4 w-4" />
                }
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-md"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
