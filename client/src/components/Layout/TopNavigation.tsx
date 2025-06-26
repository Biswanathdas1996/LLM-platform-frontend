import { Brain, Moon, Sun, Settings, Activity, Cpu, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useHealth } from '@/hooks/useLocalAPI';

export function TopNavigation() {
  const { theme, toggleTheme } = useTheme();
  const { data: health, isLoading: healthLoading } = useHealth();

  const isHealthy = health?.status === 'healthy';

  return (
    <nav className="glass-effect border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl relative overflow-hidden h-14">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 relative z-10 h-full">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center group">
              <div className="relative mr-2 sm:mr-3">
                <Brain className="text-primary h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 group-hover:scale-110" />
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  LLM Platform
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  v2.1.0
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* System Metrics - Hidden on mobile */}
            <div className="hidden lg:flex items-center space-x-1.5">
              <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-muted/30 border border-border/30">
                <Activity className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-muted-foreground">23%</span>
              </div>
              <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-muted/30 border border-border/30">
                <HardDrive className="h-3 w-3 text-blue-400" />
                <span className="text-xs text-muted-foreground">2.1GB</span>
              </div>
            </div>
            
            {/* API Status */}
            <div className="flex items-center space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center space-x-1.5">
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  healthLoading 
                    ? 'bg-amber-400 animate-pulse' 
                    : isHealthy 
                      ? 'bg-emerald-400' 
                      : 'bg-red-400'
                }`} />
                <span className="text-sm font-medium text-foreground">
                  {healthLoading 
                    ? 'Checking' 
                    : isHealthy 
                      ? 'Online' 
                      : 'Offline'
                  }
                </span>
              </div>
              {isHealthy && (
                <>
                  <div className="h-3 w-px bg-border hidden sm:block" />
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    127.0.0.1:5000
                  </span>
                </>
              )}
            </div>
            
            {/* Control Panel */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-9 w-9 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/50 transition-all duration-200 hover:scale-105 hover:shadow-glow"
              >
                {theme === 'dark' ? 
                  <Sun className="h-4 w-4 text-amber-500" /> : 
                  <Moon className="h-4 w-4 text-blue-600" />
                }
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/50 transition-all duration-200 hover:scale-105 hover:shadow-glow"
              >
                <Settings className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animated border line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
    </nav>
  );
}
